import Random "mo:core/Random";
import AccessControl "authorization/access-control";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import List "mo:core/List";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import MixinAuthorization "authorization/MixinAuthorization";


// Data Migration

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Constants
  let MAX_PLAYERS_PER_ROOM : Nat = 8;

  // Type Definitions
  public type UserId = Principal;
  public type RoomId = Nat;
  public type GameMode = { #near; #far };
  public type Category = Text;
  public type Submission = Text;
  public type ValidationVote = { #approve; #reject };
  public type StripeProduct = {
    productId : Text;
    productName : Text;
    productDescription : Text;
    priceInCents : Nat;
  };

  public type UserProfile = {
    id : UserId;
    name : Text;
    entitlements : Set.Set<Text>;
    banned : Bool;
  };

  // Immutable version of UserProfile for public interface
  public type UserProfileView = {
    id : UserId;
    name : Text;
    entitlements : [Text];
    banned : Bool;
  };

  public type Room = {
    id : RoomId;
    host : UserId;
    players : List.List<UserId>;
    mode : GameMode;
    categories : List.List<Category>;
    active : Bool;
  };

  public type RoomView = {
    id : RoomId;
    host : UserId;
    players : [UserId];
    mode : GameMode;
    categories : [Category];
    active : Bool;
  };

  public type RoundState = {
    roomId : RoomId;
    letter : Text;
    categories : List.List<Category>;
    submissions : Map.Map<UserId, Map.Map<Category, Submission>>;
    startTime : Time.Time;
    endTime : ?Time.Time;
    stopped : Bool;
  };

  public type ScoringResult = {
    scores : [Score];
    maxPoints : Nat;
    repeats : Nat;
    empty : Nat;
    valid : Nat;
  };

  public type Score = {
    player : UserId;
    points : Nat;
  };

  public type ValidationEntry = {
    roomId : RoomId;
    category : Category;
    word : Text;
    submitter : UserId;
    isValid : Bool;
  };

  public type MatchState = {
    currentRound : Nat;
    totalRounds : Nat;
    currentLetter : ?Text;
    usedLetters : Set.Set<Text>;
    isActive : Bool;
  };

  public type MatchProgress = {
    currentRound : Nat;
    totalRounds : Nat;
    currentLetter : ?Text;
    usedLetters : [Text];
    isActive : Bool;
    lastRoundScores : ?ScoringResult;
    cumulativeScores : [Score];
  };

  public type RoundPayload = {
    roundNumber : Nat;
    totalRounds : Nat;
    letter : Text;
    isActive : Bool;
  };

  public type MonthlyScore = {
    userId : UserId;
    points : Nat;
    rounds : Nat;
    wins : Nat;
    lastUpdated : Time.Time;
  };

  public type LeaderboardMonth = {
    month : Text;
    topPlayers : List.List<MonthlyScore>;
    lastUpdated : Time.Time;
  };

  public type MonthlyScoreView = {
    userId : UserId;
    points : Nat;
    rounds : Nat;
    wins : Nat;
    lastUpdated : Time.Time;
  };

  public type RoundSummary = {
    scores : [Score];
    totalValid : Nat;
    totalEmpty : Nat;
    totalRepeat : Nat;
    totalPoints : Nat;
    roundMaxPoints : Nat;
  };

  // State
  let users = Map.empty<UserId, UserProfile>();
  let rooms = Map.empty<RoomId, Room>();
  let dictionary = Map.empty<Text, Bool>(); // true = approved, false = banned
  let matchmakingQueue = List.empty<UserId>();
  let activeRounds = Map.empty<RoomId, RoundState>();
  let validationEntries = Map.empty<RoomId, List.List<ValidationEntry>>();
  var nextRoomId = 1;
  let matchStates = Map.empty<RoomId, MatchState>();

  // Scoring state for each room (persistent across rounds)
  let roomScoringState = Map.empty<RoomId, Nat>();
  let lastRoundScores = Map.empty<RoomId, ScoringResult>();

  // Categories and Products
  let defaultCategories = List.repeat("Category", 10);
  let stripeProducts = List.repeat<StripeProduct>(
    {
      productId = "premium_categories";
      productName = "Premium Categories";
      productDescription = "Access to exclusive categories";
      priceInCents = 999;
    },
    1,
  );

  // Stripe Integration
  var stripeConfig : ?Stripe.StripeConfiguration = null;

  // Monthly scoreboard tracking
  let monthlyScores = Map.empty<Text, Map.Map<UserId, MonthlyScore>>(); // Raw scores by month
  let monthlyLeaderboards = Map.empty<Text, LeaderboardMonth>(); // Top N per month

  // Convert internal profile to immutable for public use
  func convertUserProfileToView(profile : UserProfile) : UserProfileView {
    {
      id = profile.id;
      name = profile.name;
      entitlements = profile.entitlements.toArray();
      banned = profile.banned;
    };
  };

  // Convert internal room to immutable for public use
  func convertRoomToView(room : Room) : RoomView {
    {
      id = room.id;
      host = room.host;
      players = room.players.toArray();
      mode = room.mode;
      categories = room.categories.toArray();
      active = room.active;
    };
  };

  // User Management - Required by frontend
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfileView {
    users.get(caller).map(convertUserProfileToView);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfileView {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    users.get(user).map(convertUserProfileToView);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfileView) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    switch (users.get(caller)) {
      case (null) {
        users.add(
          caller,
          {
            id = caller;
            name = profile.name;
            entitlements = Set.empty<Text>();
            banned = false;
          },
        );
      };
      case (?existing) {
        users.add(
          caller,
          {
            id = caller;
            name = profile.name;
            entitlements = existing.entitlements;
            banned = existing.banned;
          },
        );
      };
    };
  };

  public shared ({ caller }) func register(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register");
    };

    if (users.containsKey(caller)) {
      Runtime.trap("Already registered");
    };

    users.add(
      caller,
      {
        id = caller;
        name;
        entitlements = Set.empty<Text>();
        banned = false;
      },
    );
  };

  // Room Management
  public shared ({ caller }) func createRoom(mode : GameMode, categories : [Category]) : async RoomId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create rooms");
    };

    // Check if user is banned
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?user) {
        if (user.banned) {
          Runtime.trap("Banned users cannot create rooms");
        };
      };
    };

    let roomId = nextRoomId;
    nextRoomId += 1;

    let categoryList = List.empty<Category>();
    categoryList.addAll(categories.values());

    rooms.add(roomId, {
      id = roomId;
      host = caller;
      players = List.repeat(caller, 1);
      mode;
      categories = categoryList;
      active = false;
    });
    roomId;
  };

  public shared ({ caller }) func joinRoom(roomId : RoomId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can join rooms");
    };

    // Check if user is banned
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?user) {
        if (user.banned) {
          Runtime.trap("Banned users cannot join rooms");
        };
      };
    };

    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.players.any(func(player) { player == caller })) {
          Runtime.trap("Already in room");
        };

        // Enforce 8-player maximum
        let currentPlayerCount = room.players.size();
        if (currentPlayerCount >= MAX_PLAYERS_PER_ROOM) {
          Runtime.trap("Room is full: maximum 8 players allowed");
        };

        room.players.add(caller);
        rooms.add(roomId, room);
      };
    };
  };

  public shared ({ caller }) func leaveRoom(roomId : RoomId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can leave rooms");
    };

    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        // Verify caller is in the room
        if (not room.players.any(func(player) { player == caller })) {
          Runtime.trap("Not in this room");
        };

        let filteredPlayers = room.players.filter(func(player) { player != caller });

        // If host leaves, transfer to next player or close room
        let newHost = if (room.host == caller) {
          switch (filteredPlayers.first()) {
            case (null) { room.host }; // Room will be empty, keep original host
            case (?newHost) { newHost };
          };
        } else {
          room.host;
        };

        rooms.add(roomId, {
          room with
          players = filteredPlayers;
          host = newHost;
        });
      };
    };
  };

  public shared ({ caller }) func startGame(roomId : RoomId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can start games");
    };

    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        // Only host can start the game
        if (room.host != caller) {
          Runtime.trap("Unauthorized: Only room host can start the game");
        };

        rooms.add(roomId, { room with active = true });
      };
    };
  };

  // Matchmaking
  public shared ({ caller }) func joinMatchmaking() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can join matchmaking");
    };

    // Check if user is banned
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?user) {
        if (user.banned) {
          Runtime.trap("Banned users cannot join matchmaking");
        };
      };
    };

    if (not matchmakingQueue.any(func(p) { p == caller })) {
      matchmakingQueue.add(caller);
    };
  };

  public shared ({ caller }) func leaveMatchmaking() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can leave matchmaking");
    };

    let filtered = matchmakingQueue.filter(func(p) { p != caller });
    matchmakingQueue.clear();
    matchmakingQueue.addAll(filtered.values());
  };

  // -------------------------------
  // 10-Round Match Functionality
  // -------------------------------

  public shared ({ caller }) func startRound(roomId : RoomId) : async RoundPayload {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can start rounds");
    };

    // Validate room existence and verify caller is the host
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        // Only the host can start rounds
        if (room.host != caller) {
          Runtime.trap("Unauthorized: Only room host can start rounds");
        };
      };
    };

    // Fetch or create default match state
    let matchState = getMatchState(roomId);

    // Validate if more rounds can be played
    let nextRound = matchState.currentRound + 1;
    if (nextRound > matchState.totalRounds) {
      Runtime.trap("All 10 rounds have already been completed");
    };

    // Generate random letter not in used set
    let newLetter = await generateRandomLetter(matchState.usedLetters);

    // Update match state
    let updatedUsedLetters = Set.empty<Text>();
    updatedUsedLetters.addAll(matchState.usedLetters.values());
    updatedUsedLetters.add(newLetter);

    let updatedState : MatchState = {
      currentRound = nextRound;
      totalRounds = matchState.totalRounds;
      currentLetter = ?newLetter;
      usedLetters = updatedUsedLetters;
      isActive = true;
    };
    matchStates.add(roomId, updatedState);

    // Create round state record
    let roundState = {
      roomId;
      letter = newLetter;
      categories = List.empty<Category>();
      submissions = Map.empty<UserId, Map.Map<Category, Submission>>();
      startTime = Time.now();
      endTime = null;
      stopped = false;
    };
    activeRounds.add(roomId, roundState);

    // Return round payload
    {
      roundNumber = nextRound;
      totalRounds = 10;
      letter = newLetter;
      isActive = true;
    };
  };

  public shared ({ caller }) func stopCurrentRound(roomId : RoomId) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can stop rounds");
    };

    // Validate room existence and verify caller is the host
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        // Only the host can stop rounds
        if (room.host != caller) {
          Runtime.trap("Unauthorized: Only room host can stop rounds");
        };
      };
    };

    switch (matchStates.get(roomId)) {
      case (null) {
        Runtime.trap("No round in progress for this room");
      };
      case (?currentMatchState) {
        if (currentMatchState.isActive) {
          let updatedState = { currentMatchState with isActive = false };
          matchStates.add(roomId, updatedState);

          // Mark round as stopped in activeRounds
          switch (activeRounds.get(roomId)) {
            case (?activeRound) {
              let stoppedRound = {
                activeRound with
                stopped = true;
                endTime = ?Time.now();
              };
              activeRounds.add(roomId, stoppedRound);

              // Perform scoring and save results
              let scoringResults = scoreRound(stoppedRound, rooms.get(roomId));
              // Update persistent cumulative points state
              let currentPoints = switch (roomScoringState.get(roomId)) {
                case (null) { 0 };
                case (?points) { points };
              };

              let newScore = switch (scoringResults.scores.find(
                func(s) { s.player == caller }
              )) {
                case (null) { 0 };
                case (?score) { score.points };
              };

              let updatedPoints = currentPoints + newScore;
              roomScoringState.add(roomId, updatedPoints);
              lastRoundScores.add(roomId, scoringResults);
            };
            case (null) {};
          };
        };
      };
    };
    "STOP - Final submissions will not be accepted";
  };

  // Helper: Aggregate scores (persistent state) with current round
  func getCumulativeScores(roomId : RoomId, roundResult : ScoringResult) : [Score] {
    let currentScores = Map.empty<UserId, Nat>();

    switch (rooms.get(roomId)) {
      case (?room) {
        for (player in room.players.values()) {
          let currentPoints = switch (roomScoringState.get(roomId)) {
            case (null) { 0 };
            case (?points) { points };
          };

          let roundPoints = switch (
            roundResult.scores.find(func(s) { s.player == player })
          ) {
            case (null) { 0 };
            case (?score) { score.points };
          };

          let totalPoints = currentPoints + roundPoints;
          currentScores.add(player, totalPoints);
        };
      };
      case (null) {};
    };

    currentScores.toArray().map(func((player, points)) { { player; points } });
  };

  public query ({ caller }) func getCurrentMatchState(roomId : RoomId) : async MatchProgress {
    // Validate room existence and authorization proof
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        // Only room members and admins can view match state
        if (not room.players.any(func(player) { player == caller }) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Not a member of this room");
        };
      };
    };

    let matchState = getMatchState(roomId);
    {
      currentRound = matchState.currentRound;
      totalRounds = matchState.totalRounds;
      currentLetter = matchState.currentLetter;
      usedLetters = matchState.usedLetters.toArray();
      isActive = matchState.isActive;
      lastRoundScores = lastRoundScores.get(roomId);
      cumulativeScores = Map.empty<UserId, Nat>().toArray().map(
        func((player, points)) { { player; points } }
      );
    };
  };

  // Helper functions for 10-round logic
  func getRandomSeed() : Nat {
    // Use current time as fallback seed
    Time.now().toNat();
  };

  // Get existing match state or initialize default
  func getMatchState(roomId : RoomId) : MatchState {
    switch (matchStates.get(roomId)) {
      case (?state) { state };
      case (null) {
        {
          currentRound = 0;
          totalRounds = 10;
          currentLetter = null;
          usedLetters = Set.empty<Text>();
          isActive = false;
        };
      };
    };
  };

  // Generates random unused letter from full Spanish alphabet [A-Z, Ñ]
  // Returns random letter if all used
  func generateRandomLetter(usedLetters : Set.Set<Text>) : async Text {
    let spanishLetters = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "Ñ",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];

    let unusedLetters = spanishLetters.filter(func(letter) { not usedLetters.contains(letter) });

    // Use fallback seed instead of Random.dev
    let seed = getRandomSeed();
    let randomIndex = seed % unusedLetters.size();

    if (unusedLetters.size() > 0) {
      unusedLetters[randomIndex];
    } else {
      // If all letters used, return random letter from full alphabet
      let fullLetterIndex = seed % spanishLetters.size();
      spanishLetters[fullLetterIndex];
    };
  };

  // Round Management - Automated validation
  public shared ({ caller }) func submitWord(roomId : RoomId, category : Category, word : Submission) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can submit words");
    };

    // Verify caller is in the room
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (not room.players.any(func(player) { player == caller })) {
          Runtime.trap("Unauthorized: Not a member of this room");
        };
      };
    };

    // Verify round is active
    switch (matchStates.get(roomId)) {
      case (null) { Runtime.trap("No active round") };
      case (?matchState) {
        if (not matchState.isActive) {
          Runtime.trap("Round is not active");
        };
      };
    };

    switch (activeRounds.get(roomId)) {
      case (null) { Runtime.trap("No active round") };
      case (?round) {
        if (round.stopped) {
          Runtime.trap("Round already stopped");
        };

        let userSubmissions = switch (round.submissions.get(caller)) {
          case (null) { Map.empty<Category, Submission>() };
          case (?subs) { subs };
        };

        userSubmissions.add(category, word);
        round.submissions.add(caller, userSubmissions);
        activeRounds.add(roomId, round);

        // Automated validation
        let isValid = validateWord(word);
        let entries = switch (validationEntries.get(roomId)) {
          case (null) { List.empty<ValidationEntry>() };
          case (?existing) { existing };
        };

        entries.add({
          roomId;
          category;
          word;
          submitter = caller;
          isValid;
        });
        validationEntries.add(roomId, entries);
      };
    };
  };

  // Automated word validation function
  func validateWord(word : Text) : Bool {
    if (word == "") {
      return false;
    };

    // Check dictionary
    switch (dictionary.get(word)) {
      case (?isApproved) { isApproved };
      case (null) {
        // If not in dictionary, apply basic validation rules
        // (In production, this would call Venezuelan slang API)
        word.size() >= 2;
      };
    };
  };

  // Get validation results for review - accessible to room members after round stops
  public query ({ caller }) func getValidationResults(roomId : RoomId) : async [{
    category : Category;
    word : Text;
    submitter : UserId;
    isValid : Bool;
  }] {
    // Any authenticated user can view validation results (guests cannot)
    // This allows frontend to retrieve results after STOP for score computation
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view validation results");
    };

    // Verify caller is in the room or is an admin
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (not room.players.any(func(player) { player == caller }) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Not a member of this room");
        };
      };
    };

    switch (validationEntries.get(roomId)) {
      case (null) { [] };
      case (?entries) {
        entries.toArray().map(func(entry) {
          {
            category = entry.category;
            word = entry.word;
            submitter = entry.submitter;
            isValid = entry.isValid;
          };
        });
      };
    };
  };

  // Dictionary Management (Admin only)
  public shared ({ caller }) func addWord(word : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage dictionary");
    };
    dictionary.add(word, true);
  };

  public shared ({ caller }) func banWord(word : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage dictionary");
    };
    dictionary.add(word, false);
  };

  public query ({ caller }) func getDictionaryEntry(word : Text) : async ?Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view dictionary");
    };
    dictionary.get(word);
  };

  // User Banning (Admin only)
  public shared ({ caller }) func banUser(userId : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can ban users");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        users.add(userId, { user with banned = true });
      };
    };
  };

  public shared ({ caller }) func unbanUser(userId : UserId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unban users");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        users.add(userId, { user with banned = false });
      };
    };
  };

  // Metrics (Admin only)
  public query ({ caller }) func getMetrics() : async {
    totalUsers : Nat;
    totalRooms : Nat;
    activeRooms : Nat;
    bannedUsers : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view metrics");
    };

    let roomsArray = rooms.values().toArray();
    let usersArray = users.values().toArray();

    {
      totalUsers = usersArray.size();
      totalRooms = roomsArray.size();
      activeRooms = roomsArray.filter(func(r) { r.active }).size();
      bannedUsers = usersArray.filter(func(u) { u.banned }).size();
    };
  };

  // -------------------------------
  // Monthly Leaderboard API
  // -------------------------------
  // Get current month's leaderboard - accessible to all authenticated users
  public query ({ caller }) func getCurrentMonthLeaderboard() : async [MonthlyScoreView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view leaderboard");
    };

    let currentMonth = getCurrentMonth();
    switch (monthlyLeaderboards.get(currentMonth)) {
      case (null) { [] };
      case (?leaderboard) {
        leaderboard.topPlayers.toArray().map(func(score) {
          {
            userId = score.userId;
            points = score.points;
            rounds = score.rounds;
            wins = score.wins;
            lastUpdated = score.lastUpdated;
          };
        });
      };
    };
  };

  // Get specific month's leaderboard - accessible to all authenticated users
  public query ({ caller }) func getMonthLeaderboard(month : Text) : async [MonthlyScoreView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view leaderboard");
    };

    switch (monthlyLeaderboards.get(month)) {
      case (null) { [] };
      case (?leaderboard) {
        leaderboard.topPlayers.toArray().map(func(score) {
          {
            userId = score.userId;
            points = score.points;
            rounds = score.rounds;
            wins = score.wins;
            lastUpdated = score.lastUpdated;
          };
        });
      };
    };
  };

  // Get current Top 1 player for rewards eligibility - accessible to all authenticated users
  public query ({ caller }) func getCurrentTop1() : async ?MonthlyScoreView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view top player");
    };

    let currentMonth = getCurrentMonth();
    switch (monthlyLeaderboards.get(currentMonth)) {
      case (null) { null };
      case (?leaderboard) {
        switch (leaderboard.topPlayers.first()) {
          case (null) { null };
          case (?topScore) {
            ?{
              userId = topScore.userId;
              points = topScore.points;
              rounds = topScore.rounds;
              wins = topScore.wins;
              lastUpdated = topScore.lastUpdated;
            };
          };
        };
      };
    };
  };

  // Get caller's monthly score - users can view their own stats
  public query ({ caller }) func getMyMonthlyScore(month : Text) : async ?MonthlyScoreView {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view their scores");
    };

    switch (monthlyScores.get(month)) {
      case (null) { null };
      case (?monthScores) {
        switch (monthScores.get(caller)) {
          case (null) { null };
          case (?score) {
            ?{
              userId = score.userId;
              points = score.points;
              rounds = score.rounds;
              wins = score.wins;
              lastUpdated = score.lastUpdated;
            };
          };
        };
      };
    };
  };

  // Admin function to update monthly scores (called after round completion)
  public shared ({ caller }) func updateMonthlyScore(userId : UserId, pointsToAdd : Nat, isWin : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update monthly scores");
    };

    let currentMonth = getCurrentMonth();
    let monthScoresMap = switch (monthlyScores.get(currentMonth)) {
      case (null) {
        let newMap = Map.empty<UserId, MonthlyScore>();
        monthlyScores.add(currentMonth, newMap);
        newMap;
      };
      case (?existing) { existing };
    };

    let updatedScore = switch (monthScoresMap.get(userId)) {
      case (null) {
        {
          userId;
          points = pointsToAdd;
          rounds = 1;
          wins = if (isWin) { 1 } else { 0 };
          lastUpdated = Time.now();
        };
      };
      case (?existing) {
        {
          userId;
          points = existing.points + pointsToAdd;
          rounds = existing.rounds + 1;
          wins = existing.wins + (if (isWin) { 1 } else { 0 });
          lastUpdated = Time.now();
        };
      };
    };

    monthScoresMap.add(userId, updatedScore);
    rebuildLeaderboard(currentMonth);
  };

  // Helper: Get current month in YYYY-MM format
  func getCurrentMonth() : Text {
    let now = Time.now();
    let seconds = now / 1_000_000_000;
    // Simplified year/month calculation (approximate)
    let days = seconds / 86400;
    let year = 1970 + (days / 365);
    let month = ((days % 365) / 30) + 1;
    year.toText() # "-" # (if (month < 10) { "0" } else { "" }) # month.toText();
  };

  // Helper: Rebuild leaderboard from monthly scores
  func rebuildLeaderboard(month : Text) {
    switch (monthlyScores.get(month)) {
      case (null) {};
      case (?monthScoresMap) {
        let scoresArray = monthScoresMap.values().toArray();
        let sortedScores = scoresArray.sort(
          func(a : MonthlyScore, b : MonthlyScore) : { #less; #equal; #greater } {
            if (a.points > b.points) { #less } else if (a.points < b.points) { #greater } else { #equal };
          },
        );

        let topPlayers = List.empty<MonthlyScore>();
        // Only keep the top N (10) entries!
        let topN = if (sortedScores.size() < 10) { sortedScores.size() } else { 10 };
        if (topN > 0) {
          let topEntries = sortedScores.sliceToArray(0, topN);
          for (entry in topEntries.values()) {
            topPlayers.add(entry);
          };
        };

        let leaderboard : LeaderboardMonth = {
          month;
          topPlayers;
          lastUpdated = Time.now();
        };
        monthlyLeaderboards.add(month, leaderboard);
      };
    };
  };

  // Stripe Integration
  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can check session status");
    };
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can create checkout sessions");
    };

    // Check if user is banned
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?user) {
        if (user.banned) {
          Runtime.trap("Banned users cannot create checkout sessions");
        };
      };
    };

    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func purchaseProduct(productId : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can purchase products");
    };

    // Check if user is banned
    switch (users.get(caller)) {
      case (null) { Runtime.trap("User not registered") };
      case (?user) {
        if (user.banned) {
          Runtime.trap("Banned users cannot make purchases");
        };
      };
    };

    let productsArray = stripeProducts.toArray();
    let product = productsArray.find(func(p) { p.productId == productId });
    switch (product) {
      case (null) { Runtime.trap("Product not found") };
      case (?prod) {
        let shoppingItem = {
          currency = "usd";
          productName = prod.productName;
          productDescription = prod.productDescription;
          priceInCents = prod.priceInCents;
          quantity = 1; // Always 1 for standard products
        };
        await Stripe.createCheckoutSession(
          getStripeConfiguration(),
          caller,
          [shoppingItem],
          "success_url",
          "cancel_url",
          transform,
        );
      };
    };
  };

  public shared ({ caller }) func grantEntitlement(userId : UserId, entitlement : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can grant entitlements");
    };

    switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?user) {
        user.entitlements.add(entitlement);
        users.add(userId, user);
      };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Query Functions with Authorization
  public query ({ caller }) func getRoom(roomId : RoomId) : async RoomView {
    switch (rooms.get(roomId)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        // Only room members and admins can view room details
        if (not room.players.any(func(player) { player == caller }) and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Not a member of this room");
        };
        convertRoomToView(room);
      };
    };
  };

  public query ({ caller }) func getAvailableRooms() : async [RoomView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view available rooms");
    };

    let availableRooms = rooms.values().toArray().filter(func(room) {
      not room.active and room.mode == #near and room.players.size() < MAX_PLAYERS_PER_ROOM
    });
    availableRooms.map(convertRoomToView);
  };

  public query ({ caller }) func getAllowedGameModes() : async [GameMode] {
    // Guests can check available modes
    switch (users.get(caller)) {
      case (null) { [#near] };
      case (?user) {
        if (user.entitlements.contains("premium_categories")) {
          [#near, #far];
        } else {
          [#near];
        };
      };
    };
  };

  public query ({ caller }) func getMyRooms() : async [RoomView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only registered users can view their rooms");
    };

    let myRooms = rooms.values().toArray().filter(func(room) {
      room.players.any(func(player) { player == caller });
    });
    myRooms.map(convertRoomToView);
  };

  // Scoring
  func scoreRound(stepState : RoundState, room : ?Room) : ScoringResult {
    let scores = Map.empty<UserId, Nat>();
    var repeatedWords = 0;
    var emptyWords = 0;
    var validWords = 0;

    // If room exists, use its players for scoring
    switch (room) {
      case (?room) {
        for (player in room.players.values()) {
          let playerSubmissionsOpt = stepState.submissions.get(player);
          switch (playerSubmissionsOpt) {
            case (null) { scores.add(player, 0) };
            case (?playerSubmissions) {
              var roundPoints = 0;
              for (category in stepState.categories.values()) {
                let submittedWord = switch (playerSubmissions.get(category)) {
                  case (?word) { word };
                  case (null) { "" };
                };
                switch (rooms.get(stepState.roomId)) {
                  case (?activeRoom) {
                    if (activeRoom.players.any(func(p) { p == player })) {
                      if (submittedWord != "") {
                        // Check automated validation
                        if (validateWord(submittedWord) and isUniqueWord(stepState, submittedWord)) {
                          roundPoints += validPoints;
                          validWords += 1;
                        } else if (not isUniqueWord(stepState, submittedWord)) {
                          roundPoints += repeatedPoints;
                          repeatedWords += 1;
                        };
                      } else {
                        emptyWords += 1;
                      };
                    };
                  };
                  case (null) {};
                };
              };
              let finalPoints = if (roundPoints > maxPoints) { maxPoints } else { roundPoints };
              scores.add(player, finalPoints);
            };
          };
        };
        {
          scores = scores.toArray().map(func((player, points)) { { player; points } });
          maxPoints;
          repeats = repeatedWords;
          empty = emptyWords;
          valid = validWords;
        };
      };
      case (null) { { scores = []; maxPoints; repeats = 0; empty = 0; valid = 0 } };
    };
  };

  let validPoints = 100;
  let repeatedPoints = 50;
  let maxPoints = 1000;

  func isUniqueWord(state : RoundState, word : Text) : Bool {
    for (category in state.categories.values()) {
      for (submissions in state.submissions.values()) {
        switch (submissions.get(category)) {
          case (?submittedWord) {
            if (submittedWord == word) { return false };
          };
          case (null) {};
        };
      };
    };
    true;
  };
};
