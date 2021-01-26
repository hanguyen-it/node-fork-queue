export default class Task {
  message: any; 
  callback: any;
  priority: any;

  constructor(message: any, callback: any, priority: any) {
    this.message = message;
    this.callback = callback;
    this.priority = priority;
  }

  
}