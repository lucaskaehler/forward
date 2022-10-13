import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
// import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';
import { Observable, of } from 'rxjs';
import { first } from 'rxjs/operators';
// import { auth } from 'firebase/app';
// import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { switchMap } from 'rxjs/operators';
// import { User } from '../@models/user.model'
// import { User } from './user';
import {
  collection,
  doc,
  docData,  
  setDoc,
  Firestore,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';
import { 
  Auth,
  signOut,
  signInWithPopup,
  user,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  OAuthProvider,
  User,
  getAuth,
 } from '@angular/fire/auth';


@Injectable({ providedIn: 'root' })
export class AuthService {
  // private user: Observable<firebase.User>;
  public userDetails: User = null;

  user$: Observable<User>;

  constructor(private auth: Auth, private router: Router, private db: Firestore) {
    // this.user$ = user(auth);
    // this.user = afAuth.authState;
    // this.user.subscribe(
    //   (user) => {
    //     if (user) {
    //       this.userDetails = user;
    //     } else {
    //       this.userDetails = null;
    //     }
    //   }
    // );
    this.user$ =  user(auth).pipe(
      switchMap((user: User | null) => {
        // Logged in
        if (user) {
          return docData(doc(this.db, 'users', user.uid)) as Observable<User>;
        } else {
          // Logged out
          return of(null);
        }
      })
    );
        // this.user$ = user(auth).pipe(
    //   switchMap((user: User | null) =>
    //     user
    //       ? docData(doc(this.afs, 'users', user.uid))
    //         as Observable<Profile>
    //       : of(null)
    //   )
    // );
  }

  // async getUser(): Promise<any> {
  //   return user(this.auth).pipe(first());
  // }

  user;
  async getUser(){
    return user(this.auth).forEach((u) => {
      this.user = u;
    });
  }

  private updateUserData({ uid, email, displayName }: User) {
    const data = {
      uid,
      email,
      displayName,
    };
    return setDoc(doc(this.db, 'users', uid), {data}, {merge: true});    
  }

  signInRegular(email, password) {
    const cred = signInWithEmailAndPassword(this.auth, email, password)
      .then((userCredential) => {
      console.log(userCredential.user);
      })
      .catch((error) => {
        console.log(error)
      })
    return cred;
  }

  createAccount(email, password) {
    createUserWithEmailAndPassword(this.auth, email, password);    
  }

  async signOut() {
    await signOut(this.auth);
    return this.router.navigate(['/']);
  }

  isLoggedIn() {
    if (this.userDetails == null) {
      return false;
    } else {
      return true;
    }
  }

  // isAdmin() {
  //   if (this.userDetails.email === 'kaehlerprojects@gmail.com') {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }

  logout() {
    signOut(this.auth)
      .then((res) => this.router.navigate(['/']));
  }

  signInWithMicrosoft() {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      prompt: 'consent',
      login_hint: 'user@conestogameats.com',
      tenant: '4eb56162-5f64-4896-b3af-4a70f4aff8ed'
    });
    const auth = getAuth();
    signInWithPopup(auth, provider)
    .then((result) => {
      

      const credential = OAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      const idToken = credential.idToken;
      this.getUsers(result)

    })
    .catch((error) => {
      console.log(error)
    });

    // firebase.auth().signInWithPopup(provider)
    // .then((result) => {

    //   this.db.collection('users').ref.where('email', '==', result.user.email).get().then(snap => {
    //     snap.forEach(doc => {
    //       let user = doc.data();
    //       this.db.collection('users').doc(user.uid).set({fname: result.user.displayName, displayName: result.user.displayName}, {merge: true});
    //     })
    //   })

    // })
    // .catch((error) => {
    //   // Handle error.
    // });
  }

  async getUsers(result: any){
    const usersRef = await collection(this.db, 'users');
    const q = query(usersRef, where('email', '==', result.user.email));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docRef) => {
      if(docRef.exists()){
        setDoc(doc(this.db, 'users', docRef.id), {id: docRef.id, fname: result.user.displayName, displayName: result.user.displayName}, {merge: true});
      }
    });
  }

  // determines if user has matching role
  // private checkAuthorization(user: User, allowedRoles: string[]): boolean {
  //   if (!user) return false
  //   for (const role of allowedRoles) {
  //     if ( user.roles[role] ) {
  //       return true
  //     }
  //   }
  //   return false
  // }

   ///// Role-based Authorization //////

  // canScreen(user: User): boolean {
  //   const allowed = ['admin', 'screener', 'nurse', 'giveaway']
  //   return this.checkAuthorization(user, allowed)
  // }

}