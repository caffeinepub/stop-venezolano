import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Category = string;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface MonthlyScoreView {
    userId: UserId;
    wins: bigint;
    lastUpdated: Time;
    rounds: bigint;
    points: bigint;
}
export interface Score {
    player: UserId;
    points: bigint;
}
export type RoomId = bigint;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface RoundPayload {
    isActive: boolean;
    totalRounds: bigint;
    letter: string;
    roundNumber: bigint;
}
export type UserId = Principal;
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface MatchProgress {
    lastRoundScores?: ScoringResult;
    currentRound: bigint;
    cumulativeScores: Array<Score>;
    isActive: boolean;
    currentLetter?: string;
    totalRounds: bigint;
    usedLetters: Array<string>;
}
export interface UserProfileView {
    id: UserId;
    name: string;
    banned: boolean;
    entitlements: Array<string>;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export type Submission = string;
export interface ScoringResult {
    maxPoints: bigint;
    valid: bigint;
    scores: Array<Score>;
    empty: bigint;
    repeats: bigint;
}
export interface RoomView {
    id: RoomId;
    categories: Array<Category>;
    active: boolean;
    host: UserId;
    mode: GameMode;
    players: Array<UserId>;
}
export enum GameMode {
    far = "far",
    near = "near"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addWord(word: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banUser(userId: UserId): Promise<void>;
    banWord(word: string): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createRoom(mode: GameMode, categories: Array<Category>): Promise<RoomId>;
    getAllowedGameModes(): Promise<Array<GameMode>>;
    getAvailableRooms(): Promise<Array<RoomView>>;
    getCallerUserProfile(): Promise<UserProfileView | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentMatchState(roomId: RoomId): Promise<MatchProgress>;
    getCurrentMonthLeaderboard(): Promise<Array<MonthlyScoreView>>;
    getCurrentTop1(): Promise<MonthlyScoreView | null>;
    getDictionaryEntry(word: string): Promise<boolean | null>;
    getMetrics(): Promise<{
        bannedUsers: bigint;
        activeRooms: bigint;
        totalUsers: bigint;
        totalRooms: bigint;
    }>;
    getMonthLeaderboard(month: string): Promise<Array<MonthlyScoreView>>;
    getMyMonthlyScore(month: string): Promise<MonthlyScoreView | null>;
    getMyRooms(): Promise<Array<RoomView>>;
    getRoom(roomId: RoomId): Promise<RoomView>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfileView | null>;
    getValidationResults(roomId: RoomId): Promise<Array<{
        submitter: UserId;
        word: string;
        category: Category;
        isValid: boolean;
    }>>;
    grantEntitlement(userId: UserId, entitlement: string): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    joinMatchmaking(): Promise<void>;
    joinRoom(roomId: RoomId): Promise<void>;
    leaveMatchmaking(): Promise<void>;
    leaveRoom(roomId: RoomId): Promise<void>;
    purchaseProduct(productId: string): Promise<string>;
    register(name: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfileView): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    startGame(roomId: RoomId): Promise<void>;
    startRound(roomId: RoomId): Promise<RoundPayload>;
    stopCurrentRound(roomId: RoomId): Promise<string>;
    submitWord(roomId: RoomId, category: Category, word: Submission): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    unbanUser(userId: UserId): Promise<void>;
    updateMonthlyScore(userId: UserId, pointsToAdd: bigint, isWin: boolean): Promise<void>;
}
