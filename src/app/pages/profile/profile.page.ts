import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent,IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack,createOutline,home,gameController,podium,personCircle,lockClosed,star,checkmark,close } from 'ionicons/icons';
import { GameService } from '../../services/game.service';
import { RewardApiService, RedeemGameRewardData } from '../../services/reward-api.service';
import { TranslatePipe } from '../../services/translate.pipe';

type RedeemState = 'idle' | 'loading' | 'success' | 'error';

interface RedeemKeySnapshot {
  key: string;
  coins: number;
  mobileNumber: string;
}

const IDEMPOTENCY_STORAGE_KEY = 'brain-rush-redeem-idempotency';

@Component({selector:'app-profile',standalone:true,imports:[CommonModule,FormsModule,IonContent,IonIcon,TranslatePipe],templateUrl:'profile.page.html',styleUrls:['profile.page.scss']})
export class ProfilePage {
  editing=false; showStats=false; draft={name:'',avatar:'',bio:''};
  withdrawNumber = '';
  withdrawMessage = '';
  avatars=['🧑‍🚀','🧑‍🎤','👩‍🚀','👨‍💻','🧑‍🎨','🦸','🧠','🤖'];

  redeemState: RedeemState = 'idle';
  redeemResult: { coins: number; rupees: string } | null = null;
  redeemErrorCode: string | null = null;

  /** Blocks resubmission of a redemption the backend already confirmed as processed. */
  private duplicateSnapshot: { coins: number; mobileNumber: string } | null = null;

  constructor(public game:GameService,private router:Router,private rewardApi: RewardApiService){addIcons({arrowBack,createOutline,home,gameController,podium,personCircle,lockClosed,star,checkmark,close});}

  go(p:string){this.router.navigateByUrl(p)}
  edit(){this.draft={...this.game.profile};this.editing=true;}
  cancel(){this.editing=false;}
  save(){this.draft.name=this.draft.name.trim()||'Player';this.game.updateProfile(this.draft);this.editing=false;}

  get canWithdraw(): boolean { return this.game.coins >= this.game.minRedeemCoins; }
  get withdrawNumberValid(): boolean { return /^\d{10}$/.test(this.withdrawNumber); }
  get isRedeeming(): boolean { return this.redeemState === 'loading'; }

  get isBlockedByDuplicate(): boolean {
    return !!this.duplicateSnapshot
      && this.duplicateSnapshot.coins === this.game.coins
      && this.duplicateSnapshot.mobileNumber === this.withdrawNumber;
  }

  onWithdrawNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.withdrawNumber = input.value.replace(/\D/g, '').slice(0, 10);
    if (this.redeemState !== 'loading') {
      this.redeemState = 'idle';
      this.redeemErrorCode = null;
      this.withdrawMessage = '';
    }
  }

  withdraw(): void {
    if (!this.canWithdraw || !this.withdrawNumberValid || this.isRedeeming || this.isBlockedByDuplicate) return;

    const coinsToRedeem = this.game.coins;
    const mobileNumber = this.withdrawNumber;
    const idempotencyKey = this.getOrCreateIdempotencyKey(coinsToRedeem, mobileNumber);

    this.redeemState = 'loading';
    this.withdrawMessage = '';
    this.redeemResult = null;

    this.rewardApi.redeemCoins(mobileNumber, coinsToRedeem, idempotencyKey).subscribe({
      next: response => this.handleRedeemResponse(response),
      error: (err: { errorCode?: string; message?: string }) => this.handleRedeemFailure(err.errorCode, err.message)
    });
  }

  private handleRedeemResponse(response: RedeemGameRewardData): void {
    // Backend is the source of truth for both the deducted coins and the ₹ amount.
    this.game.confirmRedemption(response.coinsRedeemed);
    this.redeemResult = { coins: response.coinsRedeemed, rupees: response.amountCredited };
    this.redeemState = 'success';
    this.clearIdempotencyKey();
  }

  private handleRedeemFailure(errorCode?: string, message?: string): void {
    this.redeemState = 'error';
    this.redeemErrorCode = errorCode || null;
    if (errorCode === 'DUPLICATE_CONVERSION') {
      this.duplicateSnapshot = { coins: this.game.coins, mobileNumber: this.withdrawNumber };
      this.withdrawMessage = '';
      return;
    }
    // Coins were never deducted locally, so a network/backend failure is a safe, retryable state.
    this.withdrawMessage = message || '';
  }

  dismissRedeemResult(): void {
    this.redeemState = 'idle';
    this.redeemResult = null;
    this.redeemErrorCode = null;
    this.withdrawMessage = '';
    this.withdrawNumber = '';
    this.duplicateSnapshot = null;
  }

  private getOrCreateIdempotencyKey(coins: number, mobileNumber: string): string {
    try {
      const raw = localStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<RedeemKeySnapshot>;
        if (stored && stored.coins === coins && stored.mobileNumber === mobileNumber && typeof stored.key === 'string') {
          return stored.key;
        }
      }
    } catch {
      // Ignore malformed storage; a fresh key will be generated below.
    }
    const key = `brainrush-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      const snapshot: RedeemKeySnapshot = { key, coins, mobileNumber };
      localStorage.setItem(IDEMPOTENCY_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Local storage can fail in private/embedded contexts; redemption still works,
      // it just loses cross-reload retry dedupe.
    }
    return key;
  }

  private clearIdempotencyKey(): void {
    try { localStorage.removeItem(IDEMPOTENCY_STORAGE_KEY); } catch { /* no-op */ }
  }
}
