import { Component, inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

@Component({
  selector: 'app-baraka-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './baraka-chatbot.html',
  styleUrls: ['./baraka-chatbot.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class BarakaChatbot implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  readonly cdr = inject(ChangeDetectorRef);

  isOpen = false;
  isTyping = false;
  userInput = '';
  messages: Message[] = [];
  session: any = null;

  // Template itère sur strings : @for (q of quickReplies; track q) / {{ q }}
  quickReplies = [
    'Quel est mon solde de congés ?',
    'Comment faire une demande d\'autorisation ?',
    'Comment soumettre un congé maladie ?',
    'Comment voir l\'état de mes demandes ?',
    'Comment changer mon mot de passe ?',
    'Comment contacter la Direction RH ?'
  ];

  ngOnInit() {
    this.session = this.auth.session ?? null;

    this.messages = [{
      role: 'assistant',
      content: `Bonjour ${this.getFirstName()} ! 👋\n\nJe suis **AlBaraka Assistant**, votre assistant RH intelligent. Je peux vous aider avec vos congés, autorisations, procédures internes et bien plus.\n\nComment puis-je vous aider aujourd'hui ?`,
      time: this.getTime()
    }];
    this.cdr.markForCheck();
  }

  private getFirstName(): string {
    const full = this.session?.nomComplet ?? this.session?.nom ?? this.session?.prenom ?? '';
    return full.split(' ')[0] ?? '';
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.cdr.markForCheck();
    if (this.isOpen) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  getTime(): string {
    return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  sendQuickReply(text: string) {
    this.userInput = text;
    this.cdr.markForCheck();
    setTimeout(() => this.send(), 50);
  }

  // Template uses (keydown)="onKeydown($event)" — lowercase 'd'
  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  clearChat() {
    this.messages = [];
    this.isTyping = false;
    this.ngOnInit();
  }

  private scrollToBottom() {
    setTimeout(() => {
      // Template uses class="baraka-messages" (not an id)
      const el = document.querySelector('.baraka-messages');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }

  private buildSystemPrompt(): string {
    return `Tu es AlBaraka Assistant, l'assistant RH intelligent de Al Baraka Assurances (Tunisie).
Tu réponds TOUJOURS en français. Sois précis, chaleureux et professionnel.
Informations sur l'utilisateur connecté :
- Nom complet : ${this.session?.nomComplet ?? ''}
- Matricule : ${this.session?.matricule ?? ''}
- Rôle : ${this.session?.role ?? ''}
- Direction : ${this.session?.direction ?? ''}
- Service : ${this.session?.service ?? ''}
- Solde congés disponible : ${this.session?.soldeConges ?? 'N/A'} jours

TES CAPACITÉS :
1. Congés : expliquer comment soumettre une demande de congé
2. Autorisations : expliquer la demande d'autorisation de sortie
3. Congé maladie : expliquer comment soumettre un arrêt maladie
4. Mot de passe : comment changer son mot de passe dans Mon Profil
5. Mes demandes : voir l'état dans "Mes demandes"
6. Contact RH : orienter vers la Direction RH

RÈGLES :
- Réponds en maximum 4 phrases sauf si on demande plus
- Utilise des émojis avec modération
- Ne révèle jamais de données d'autres employés
- Si tu ne sais pas, oriente vers la Direction RH`;
  }

  private getToken(): string {
    // Source principale : session Angular en mémoire (sessionStorage['user_session'])
    if (this.auth.token) return this.auth.token;

    // Fallback sessionStorage
    try {
      const raw = sessionStorage.getItem('user_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
      }
    } catch { /* rien */ }

    // Fallback localStorage
    const keys = ['token', 'authToken', 'jwt', 'access_token', 'auth_token', 'bearerToken', 'currentUser'];
    for (const key of keys) {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === 'string') return parsed;
          if (parsed?.token) return parsed.token;
          if (parsed?.accessToken) return parsed.accessToken;
          if (parsed?.jwt) return parsed.jwt;
        } catch {
          return val;
        }
      }
    }
    return '';
  }

  async send() {
    const text = this.userInput.trim();
    if (!text || this.isTyping) return;

    this.messages = [...this.messages, { role: 'user', content: text, time: this.getTime() }];
    this.userInput = '';
    this.isTyping = true;
    this.cdr.markForCheck();
    this.scrollToBottom();

    const conversationHistory = this.messages
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    const token = this.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });

    // OpenAI-compatible format (Groq)
    const body = {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: this.buildSystemPrompt() },
        ...conversationHistory
      ],
      max_tokens: 1000,
      stream: false
    };

    try {
      const data: any = await firstValueFrom(
        this.http.post('/api/chatbot/message', body, { headers })
      );

      const reply = data?.choices?.[0]?.message?.content
        ?? data?.content?.[0]?.text
        ?? data?.error
        ?? "Je suis désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.";

      this.messages = [...this.messages, { role: 'assistant', content: reply, time: this.getTime() }];

    } catch (err: any) {
      const errBody = err?.error;
      const errMsg = typeof errBody === 'string'
        ? errBody
        : errBody?.error?.message ?? errBody?.error ?? err?.message ?? 'Erreur inconnue';

      this.messages = [...this.messages, {
        role: 'assistant',
        content: `⚠️ ${errMsg}`,
        time: this.getTime()
      }];
    }

    this.isTyping = false;
    this.cdr.markForCheck();
    this.scrollToBottom();
  }

  formatMessage(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }
}
