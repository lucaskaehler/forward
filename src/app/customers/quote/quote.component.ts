import { Component, OnInit } from '@angular/core';
import { collection, doc, Firestore, getDocs, query, setDoc, addDoc, getDoc, updateDoc } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import * as moment from 'moment';
import { Country, State, City } from 'country-state-city';
import { url } from 'inspector';

// import { LocationService } from 'src/app/services/location.service';
// import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-quote',
  templateUrl: './quote.component.html',
  styleUrls: ['./quote.component.scss'],
  providers: [DecimalPipe]

})
export class QuoteComponent implements OnInit {

  constructor(
    private db: Firestore,
    private notification: MatSnackBar,
    private numberFormater: DecimalPipe,

  ) {

  }

  FORWARD = 'www.forwardtranslations.ca';

  quote: any = {
    fname: null,
    lname: null,
    email: null,
    phone: null,
    source: 'PT',
    target: "EN",
    totalPages: 0,
    shipping: false,
    currency: "CAD",
    certificationPrice: null,
    shippingPrice: 0,
    translationPrice: 0,
    totalPrice: 0,
    quoteDate: moment().format("YYYY-MM-DD").toString(),
    shippingId: null,
    shippingAddress: {},
    message: null,
    pages: 0,
    certifiedTraslation: true
  };

  uploading: boolean = false;
  uploaded: boolean = false;


  files: any[] = [];
  sourceLanguages: any[] = [{ value: "EN", name: "English" }, { value: "PT", name: "Portuguese" }];
  targetLanguages: any[] = [{ value: "EN", name: "English" }, { value: "PT", name: "Portuguese" }];
  TRANSLATION_SOURCE: string = "PT";
  TRANSLATION_TARGET: string = "EN";
  DEFAUL_CURRENCY: string = "CAD";
  selectedCountry = "Brazil";

  priceRange: any[] = [];
  price: any = { page: 25, shipping: 0 };
  latestRates: any = null;
  certificationCost;

  // SHIPPING INFO
  countriesList: any[] = [
    { shortName: "BR", name: "Brazil", currency: "BRL" },
    { shortName: "CA", name: "Canada", currency: "CAD" },
    // {shortName: "CO", name: "Colombia", currency: "COP"}, 
    // {shortName: "CH", name: "China", currency: "CNY"}, 
    // {shortName: "EU", name: "Euro Member Contries", currency: "EUR"}, 
    // {shortName: "KP", name: "South Korea", currency: "KRW"}, 
    // {shortName: "MX", name: "Mexico", currency: "MXN"}, 
    // {shortName: "PH", name: "Philippines", currency: "PHP"}, 
    // {shortName: "US", name: "United States of America", currency: "USD"}
  ];
  statesList: any[] = [];
  citiesList: any[] = [];

  getPriceRange() {
    const priceCollection = collection(this.db, 'prices');
    const q = query(priceCollection);
    getDocs(q).then(snap => {
      snap.forEach(doc => {
        this.priceRange.push({ ...doc.data(), id: doc.id });
      })
    })
  }

  getExchangeRate() {
    let defaultCurrency = this.DEFAUL_CURRENCY;
    function prop<T, K extends keyof T>(obj: T, key: K) {
      let currency: any = obj[key];
      let cad: any = obj[defaultCurrency];
      let exchangeRate = cad / currency;
      return exchangeRate;
    }
    this.quote.exchangeRate = prop(this.latestRates.rates, this.quote.currency);
  }


  // getFileData(event) {
  //   for (let x = 0; x < event.target.files.length; x++) {
  //     let file = { name: event.target.files[x].name, file: event.target.files[x], data: null, pages: event.target.files[x].type === "application/pdf" ? 0 : 1, type: event.target.files[x].type.split("/")[1] };
  //     if (event.target.files[x].type === "application/pdf" || event.target.files[x].type === "image/jpeg" || event.target.files[x].type === "image/png" || event.target.files[x].type === "application/tiff") {
  //       let reader = new FileReader();
  //       reader.onload = (e: any) => {
  //         let data = e.target.result
  //         this.files[this.files.indexOf(file)].data = data;
  //       };
  //       if (event.target.files[x].type === "application/pdf") {
  //         reader.readAsArrayBuffer(event.target.files[x]);
  //       }
  //     }
  //     this.files.push(file);
  //   }
  // }

  getFileData(event) {
    // if (this.quote.fname && this.quote.lname && this.quote.email) {
    let x = 0;
    for (x = 0; x < event.target.files.length; x++) {
      let file = { name: event.target.files[x].name, file: event.target.files[x], data: null, pages: event.target.files[x].type === "application/pdf" ? 0 : 1, type: event.target.files[x].type.split("/")[1] };
      if (event.target.files[x].type === "application/pdf" || event.target.files[x].type === "image/jpeg" || event.target.files[x].type === "application/png" || event.target.files[x].type === "application/tiff") {
        let reader = new FileReader();
        reader.onload = (e: any) => {
          let data = e.target.result
          this.files[this.files.indexOf(file)].data = data;
        };
        if (event.target.files[x].type === "application/pdf") {
          reader.readAsArrayBuffer(event.target.files[x]);
        }
      }
      this.files.push(file);
    }
    this.getTotal();
    // } else {
    //   this.snackBar.open("Please inform First Name, Last Name, and E-mail", "", {
    //     duration: 5000,
    //     panelClass: ["warning-snackbar"]
    //   });
    // }
  }

  getPageNumber(event, name) {
    let objIndex = this.files.findIndex(obj => obj.name === name);
    this.files[objIndex].pages = event._pdfInfo.numPages;
    // this.quote.pages = this.quote.pages + event._pdfInfo.numPages;
    this.getTotal();
  }

  getTotal() {
    let CERT_COST = this.certificationCost;

    if (this.quote.pages > 0) {
      this.quote.pages = 0;
    }
    for (let x = 0; x < this.files.length; x++) {
      this.quote.pages = this.files[x].pages + this.quote.pages;
    }
    if (this.quote.pages > 0) {
      for (let x = 0; x < this.priceRange.length; x++) {
        if (this.quote.pages >= this.priceRange[x].minPages && this.quote.pages <= this.priceRange[x].maxPages) {
          this.price.page = this.priceRange[x].price;
        }
      }
      // this.price.shipping = (this.quote.shipping && this.quote.shippingAddress.country !== 'CA') ? 25 : (this.quote.shipping && this.quote.shippingAddress.country) ? 0 : 0;
      this.quote.translationPrice = (this.quote.pages * this.price.page);
      // this.quote.shippingPrice = this.price.shipping;
      // this.quote.totalPrice = this.numberFormater.transform((this.quote.translationPrice + this.certificationCost), "1.2-2")
      CERT_COST = this.quote.certifiedTraslation ? this.certificationCost : 0;
      this.quote.totalPrice = this.numberFormater.transform((this.quote.translationPrice + this.quote.shippingPrice + CERT_COST) / (this.quote.currency === "CAD" ? 1 : this.quote.exchangeRate), "1.2-2")
      // this.quote.gross = this.quote.translationPrice + this.quote.shippingPrice + this.certificationCost;
      this.quote.certificationPrice = CERT_COST
    }
  }


  async submit() {
    let docRef = doc(collection(this.db, 'quotes'));
    let docId = docRef.id;
    await setDoc(doc(collection(this.db, 'quotes'), docId), this.quote).then(() => {
      if (this.files.length > 0) {
        this.upload(docId);
      } else {
        this.clear();
        this.notification.open('Quote submitted', '', {
          duration: 2000,
          panelClass: ["success-snackbar"]
        });
      }
    });
  }

  async upload(docId: any) {
    let uploadedFiles: any[] = [];
    const storage = getStorage();
    let count = 0;
    for (let x = 0; x < this.files.length; x++) {

      
      const storageRef = ref(storage, `quotes/${docId}/files/${this.files[x].name}`);

      const uploadTask = uploadBytesResumable(storageRef, this.files[x].data);
      uploadTask.on('state_changed',
        (snapshot) => {

          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':

              console.log('Upload is running');
              break;
          }
        },
        (error) => {
          // Handle unsuccessful uploads
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            let data = {
              name: this.files[x].name,
              pages: this.files[x].pages,
              url: downloadURL
            }
            this.files[x].url = downloadURL;

            count++;
            addDoc(collection(this.db, 'quotes', docId, 'files'), data);
            if (count === this.files.length) {
              this.sendEmail();
              this.notification.open('Your quote request has been received. We will contact you within 2 business days', '', {
                duration: 8000,
                panelClass: ["success-snackbar"]
              });
            }
          });
        }
      );
    }
  }

  clear() {
    this.files = [];
    this.quote = {
      fname: null,
      lname: null,
      email: null,
      source: 'PT',
      target: "EN",
      totalPages: 0,
      shipping: false,
      currency: "CAD",
      certificationPrice: null,
      shippingPrice: 0,
      translationPrice: 0,
      totalPrice: 0,
      quoteDate: moment().format("YYYY-MM-DD").toString(),
      shippingId: null,
      shippingAddress: {},
      message: null,
      pages: 0
    };
  }


  // getCurrency() {
  //   this.locationService.getCurrency()
  //     .then(result => this.latestRates = result)
  //     .catch(error => this.latestRates = null)
  //     .then(() => this.getExchangeRate());
  // }

  async getCertificationCost() {
    const docRef = doc(this.db, "settings", "certificationCost");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      this.certificationCost = docSnap.data().comissionerOfOaths;
    } else {
      console.log("Certification Cost not found!");
    }
  }

  removeFile(i) {
    if (i > -1) {
      this.files.splice(i, 1);
      this.price.shipping = 0;
      this.quote.pages = 0;
      this.price.page = 0;
      this.getTotal();
    }
  }

  onCurrencyChange() {
    if (this.quote.customerPrice) {
      this.getExchangeRate();
      this.getTotal();
    }
  }

  onShippingCountryChange(arg: any) {
    this.statesList = State.getStatesOfCountry(arg);
    this.onShippingSelected(true);
  }

  onShippingStateChange(arg) {
    this.citiesList = City.getCitiesOfState(this.quote.shippingAddress.country, arg.isoCode);
  }

  onShippingSelected(arg: any) {
    if (arg === true && this.quote.shippingAddress.country === 'BR') {
      this.quote.shippingPrice = 25;
      this.getTotal();
    }
    else {
      this.quote.shippingPrice = 0;
      this.getTotal();
    }

  }

  sendEmail() {


    let html: string = '';
    let subject = `New Quote from - ${moment().format('DD MMM')}`;
    let shipping: string = '<div></div>';


    for (let x = 0; x < this.files.length; x++) {
      html = html.concat(
        `<tr>
            <td><a href='${this.files[x].url}'>
            ${this.files[x].name}
            </a>
            <td>${this.files[x].pages}</td>
          </tr>
          `
      )
    }
    if(Object.keys(this.quote.shippingAddress).length !== 0){
      shipping = `
      <br><br>
      <div><strong>SHIPPING INFORMATION</div>
      <div><strong>Address:</strong> ${this.quote.shippingAddress.address}</div>
      <div><strong>City:</strong> ${this.quote.shippingAddress.city.name}, ${this.quote.shippingAddress.state.isoCode}</div>
      <div><strong>Country:</strong> ${this.quote.shippingAddress.state.countryCode}</div>
      <div><strong>Postal Code:</strong> ${this.quote.shippingAddress.zip}</div>
      <br><br>
      `
    }

    let data = {
      to: 'alinekaehler1@gmail.com; info@forwardtranslations.ca',
      message: {
        subject: subject,
        text: "This is the plaintext section of the email body.",
        html: `<html>
        <head>
        <style>
        table { font-family: arial, sans-serif; border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #dddddd; text-align: left; padding: 8px; }
        tr:nth-child(even) { background-color: #dddddd; }
        </style>
        </head>
        <div><strong>CLIENT</strong></div> 
        <div style="margin-top:10px;"><strong>Name:</strong> ${this.quote.fname} ${this.quote.lname}</div>
        <div><strong>E-mail: </strong>${this.quote.email}</div>
        <div><strong>Phone#: </strong>${this.quote.phone}</div>
        <div><strong>Translation: </strong>${this.quote.source} to ${this.quote.target}</div>
        </br></br>
        <div><strong>Message: </strong><p style="padding-left: 30px">${this.quote.message !== null ? this.quote.message : 'no message'}</p></div> 
        </br></br>
        <div style="margin-top:16px;"><strong>PRICE</strong></div>
        <div><strong>Translation: </strong>$${this.quote.translationPrice}</div>
        <div><strong>Certification: </strong>$${this.quote.certificationPrice}</div>
        <div><strong>Shipping: </strong>$${this.quote.shippingPrice}</div></br>
        <div><strong>TOTAL: </strong>$${this.quote.totalPrice}</div>        
        </br></br>
        ${shipping}
        <div style="margin-top:16px;"><strong>FILES</strong></div>
        </br>
        <table>
          <tr><th>File Name</th>
          <th>Pages</th>
          </tr>
          ${html}
          <td></td>
          <td><strong>${this.quote.pages}</strong></td>
        </table></html>`
      },
    }
    const emailCollection = collection(this.db, 'mail');
    addDoc(emailCollection, data).then(() => 
    this.clear()
    );
  }

  swapLanguages() {
    this.quote.source = this.quote.source === 'PT' ? 'EN' : 'PT';
    this.quote.target = this.quote.target === 'PT' ? 'EN' : 'PT';
  }

  ngOnInit(): void {
    this.getCertificationCost();
    this.getPriceRange();
    // this.getCurrency();

  }

}
