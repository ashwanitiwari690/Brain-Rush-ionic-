/**
 * Single source of truth for this game's identity and redemption rules on the
 * Central Game Reward API. Do not hardcode the game code or these thresholds
 * anywhere else — import them from here.
 */
export const REWARD_CONFIG = {
  gameCode: 'BRAIN_RUSH',
  /**
   * Base URL of the Central Game Reward API's game-rewards router
   * (nodejs/src/modules/games/game-rewards.routes.ts, mounted at
   * /api/game-rewards in the Main Platform backend). Points at the local
   * dev server for now — swap to the deployed Main Platform URL for
   * staging/production builds.
   */
  apiBaseUrl: 'http://localhost:4227/api/game-rewards',
  // Matches the Game.minimumCoins default seeded for BRAIN_RUSH. The
  // backend is still authoritative and re-validates this on every request;
  // GET /api/games returns the live value if it's ever changed by an admin.
  minRedeemCoins: 1000
} as const;
