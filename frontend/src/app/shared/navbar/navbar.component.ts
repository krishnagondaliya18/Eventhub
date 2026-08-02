import { Component, inject, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  auth = inject(AuthService);
  menuOpen    = false;
  dropdownOpen = false;

  toggleMenu() { this.menuOpen = !this.menuOpen; }
  logout()     { this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    if (!(e.target as HTMLElement).closest('.user-dropdown')) {
      this.dropdownOpen = false;
    }
  }
}
