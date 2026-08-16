import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent,IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBack,createOutline,home,gameController,podium,personCircle,lockClosed,star,checkmark,close } from 'ionicons/icons';
import { GameService } from '../../services/game.service';
import { TranslatePipe } from '../../services/translate.pipe';
@Component({selector:'app-profile',standalone:true,imports:[CommonModule,FormsModule,IonContent,IonIcon,TranslatePipe],templateUrl:'profile.page.html',styleUrls:['profile.page.scss']})
export class ProfilePage {
  editing=false; showStats=false; draft={name:'',avatar:'',bio:''};
  withdrawNumber = '';
  withdrawMessage = '';
  avatars=['🧑‍🚀','🧑‍🎤','👩‍🚀','👨‍💻','🧑‍🎨','🦸','🧠','🤖'];
  constructor(public game:GameService,private router:Router){addIcons({arrowBack,createOutline,home,gameController,podium,personCircle,lockClosed,star,checkmark,close});}
  go(p:string){this.router.navigateByUrl(p)}
  edit(){this.draft={...this.game.profile};this.editing=true;}
  cancel(){this.editing=false;}
  save(){this.draft.name=this.draft.name.trim()||'Player';this.game.updateProfile(this.draft);this.editing=false;}
  get canWithdraw(): boolean { return this.game.coins >= 1000; }
  get withdrawNumberValid(): boolean { return /^\d{10}$/.test(this.withdrawNumber); }
  onWithdrawNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.withdrawNumber = input.value.replace(/\D/g, '').slice(0, 10);
    this.withdrawMessage = '';
  }
  withdraw(): void {
    if (!this.canWithdraw || !this.withdrawNumberValid) return;
    this.withdrawMessage = 'Withdrawal UI is ready. API integration can be connected later.';
  }
}
