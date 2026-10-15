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

  closeMenu()  { this.menuOpen = false; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.dropdownOpen = false;
    }
    if (!target.closest('.nav-links') && !target.closest('.hamburger')) {
      this.menuOpen = false;
    }
  }
}
