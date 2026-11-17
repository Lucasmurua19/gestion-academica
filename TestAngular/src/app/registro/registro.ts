import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth-service';
import { mensajeDeError } from '../utils/api-error';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {

  nombre: string = '';
  email: string = '';
  password: string = '';
  error: string = '';

  constructor(

    private authService: AuthService,
    private router: Router

  ) { }

  registrarse() {

    this.error = '';

    this.authService.registro({ nombre: this.nombre, email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/home']),
      error: (err) => this.error = mensajeDeError(err, 'Error al registrarse')
    });

  }

}
