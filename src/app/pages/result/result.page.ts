import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent,IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { play,home,trophy,arrowForward,star,cash,playCircle } from 'ionicons/icons';
import { GameService } from '../../services/game.service';
import { RewardAdService } from '../../services/reward-ad.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../services/translate.pipe';
@Component({selector:'app-result',standalone:true,imports:[CommonModule,IonContent,IonIcon,TranslatePipe],templateUrl:'result.page.html',styleUrls:['result.page.scss']})
export class ResultPage{
  isWatchingAd = false;
  adErrorMessage = '';

  constructor(public game:GameService,private router:Router,private rewardAd:RewardAdService,private language:LanguageService){addIcons({play,home,trophy,arrowForward,star,cash,playCircle})}

  get playerRank(){return this.game.leaders.length ? this.game.leaders[this.game.leaders.length-1].rank : 15;}
  go(p:string){this.router.navigateByUrl(p)}
  playAgain(){this.router.navigate(['/game'],{queryParams:{mode:this.game.lastResult.modeId,level:this.game.lastResult.level}})}

  get canDoubleCoins(): boolean {
    return this.game.lastResult.coins > 0 && !this.game.lastResult.coinsDoubled;
  }

  async doubleCoins(): Promise<void> {
    if (!this.canDoubleCoins || this.isWatchingAd) return;
    this.adErrorMessage = '';
    this.isWatchingAd = true;
    const granted = await this.rewardAd.watch();
    this.isWatchingAd = false;
    if (granted) {
      this.game.doubleLastResultCoins();
    } else {
      this.adErrorMessage = this.language.t('common.adUnavailable');
    }
  }
}
