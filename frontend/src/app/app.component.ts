import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AiChatbotComponent } from './shared/ai-chatbot/ai-chatbot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AiChatbotComponent],
  template: `
    <router-outlet></router-outlet>
    <app-ai-chatbot></app-ai-chatbot>
  `
})
export class AppComponent {}
