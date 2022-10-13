import { Injectable } from '@angular/core';
import {
  doc,
  setDoc,
  Firestore,
  collection,
  where,
  query,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })

export class FirebaseService {

  constructor(private db: Firestore) {}

  data: any[] = [];
  dayforce: any[] = [];

  getCollection(col: any){
    const collectionRef = collection(this.db, col);
    let q = query(collectionRef);
    getDocs(q).then(snap => {
      snap.forEach(doc => {
        if (doc.exists()){
          this.data.push(doc.data() as []);
        } else {
          return [];
        }
      })
    }).then(() => {
      return this.data;
    })
  }

  getDayforce(){
    let dayforce = [];
    const collectionRef = collection(this.db, 'dayforce');
    let q = query(collectionRef);
    getDocs(q).then(snap => {
      snap.forEach(doc => {
        if (doc.exists()){
          dayforce.push(doc.data() as []);
        } else {
          return [];
        }
      })
    }).then(() => {
      return dayforce;
    })
  }

  getCollectionWhere(col: any, field: string, condition: any, value: any){
    const collectionRef = collection(this.db, col);
    let q = query(collectionRef, where(field, condition, value));
    getDocs(q).then(snap => {
      snap.forEach(doc => {
        if (doc.exists()){
          return doc.data();
        } else {
          return null;
        }
      })
    })
  }

  getSubCollection(col: string, colDoc: string, subCol: string){
    const collectionRef = collection(this.db, col, colDoc, subCol);
    let q = query(collectionRef);
    getDocs(q).then(snap => {
      snap.forEach(doc => {
        if (doc.exists()){
          return doc.data();
        } else {
          return null;
        }
      })
    })
  }

  addDoc(col: any, colDoc: string, data: any){
    addDoc(collection(this.db, col), data);
  }

  updateDoc(col: string, colDoc: string, data: any){
    setDoc(doc(this.db, col, colDoc), data, {merge: true});
  }

  deleteDoc(col: string, colDoc: string){
    deleteDoc(doc(this.db, col, colDoc));
  }

}