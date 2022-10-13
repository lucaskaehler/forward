import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';
import 'firebase/auth';

// import { AngularFireAuth } from '@angular/fire/auth';
// import { AngularFirestore } from '@angular/fire/firestore';
// import { User } from '../@models/user.model';

import { doc, Firestore } from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { getDoc } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})

export class AuthGuard implements CanActivate {
  userCred;
  constructor(private router: Router, private auth: Auth, private db: Firestore, ) {
    this.auth.onAuthStateChanged((user) => {
      if(!user){
        return this.userCred = null;
      } else {
        // const usersRef = collection(db, "users");
        // usersRef.
        const userDoc = doc(this.db, 'users', user.uid);
        getDoc(userDoc).then(doc => {
          if(doc.exists){
            this.userCred = doc.data() as User;
            // this.router.navigate(['user/dashboard']);
          }
        });     
      }
    })
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | Observable<boolean> | Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.auth.onAuthStateChanged((user: User) => {
        if(user){
          resolve(true);          
        } else {
          console.log('User is not logged in');
          this.router.navigate(['/user/login']);
          resolve(false);
        }
        });
      });
  }
}