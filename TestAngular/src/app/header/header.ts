import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {

  constructor(

    protected authService: AuthService,
    protected router: Router

  ) { }

  logout() {

    this.authService.logout();
    this.router.navigate(['/login']);

  }

}
