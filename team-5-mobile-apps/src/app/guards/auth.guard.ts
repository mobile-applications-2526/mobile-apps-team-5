import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuardService implements CanActivate {
  constructor(private supabase: SupabaseService, private router: Router) { }

  async canActivate(): Promise<boolean | UrlTree> {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session ? true : this.router.parseUrl('/login');
  }
}
