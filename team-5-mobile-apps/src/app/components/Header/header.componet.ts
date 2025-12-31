import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { addIcons } from 'ionicons';
import { personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [IonicModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @Input() user: any = null;

  constructor() {
    addIcons({ personCircleOutline });
  }

  getInitials() {
    const name = this.user?.full_name || '';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';

    const letters = parts.map((s: string) => s[0]).join('');
    return letters.slice(0, 2).toUpperCase();
  }
}
