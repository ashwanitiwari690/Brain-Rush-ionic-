import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent,IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { play,home,trophy,arrowForward,star,cash } from 'ionicons/icons';
import { GameService } from '../../services/game.service';
import { TranslatePipe } from '../../services/translate.pipe';
@Component({selector:'app-result',standalone:true,imports:[CommonModule,IonContent,IonIcon,TranslatePipe],templateUrl:'result.page.html',styleUrls:['result.page.scss']})
export class ResultPage{constructor(public game:GameService,private router:Router){addIcons({play,home,trophy,arrowForward,star,cash})} get playerRank(){return this.game.leaders.length ? this.game.leaders[this.game.leaders.length-1].rank : 15;} go(p:string){this.router.navigateByUrl(p)} playAgain(){this.router.navigate(['/game'],{queryParams:{mode:this.game.lastResult.modeId,level:this.game.lastResult.level}})}}
