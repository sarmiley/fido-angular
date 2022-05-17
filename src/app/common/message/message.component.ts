import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MessageService } from './message.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
  messages: string[] = [];

  constructor(public message: MessageService) {
    new BehaviorSubject(this.message.messages).subscribe((msg) => (this.messages = msg));
  }

  ngOnInit(): void {}
}
