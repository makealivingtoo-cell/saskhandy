declare module "nodemailer" {
 interface Transport {
  sendMail(options: {from:string;to:string;subject:string;html:string;text:string}):Promise<unknown>;
 }
 const nodemailer:{createTransport(options:{host:string;port:number;secure:boolean;auth:{user:string;pass:string};connectionTimeout:number;greetingTimeout:number;socketTimeout:number}):Transport};
 export default nodemailer;
}
