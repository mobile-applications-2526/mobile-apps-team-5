import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EventStore } from '../../store/event.store';
import { SavedStore } from '../../store/saved.store';
import { EventModel } from '../../models/event.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-event-swipe',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './event-swipe.component.html',
  styleUrls: ['./event-swipe.component.scss'],
})
export class EventSwipeComponent implements OnInit, OnDestroy {
  events: EventModel[] = [];
  sub?: Subscription;

  // drag state
  dragging = false;
  startX = 0;
  startY = 0;
  translateX = 0;
  translateY = 0;
  rotation = 0;

  @ViewChild('topCard', { static: false }) topCard?: ElementRef<HTMLElement>;

  constructor(public store: EventStore, public saved: SavedStore) {}

  ngOnInit() {
    this.sub = this.store.events$.subscribe((list) => (this.events = list));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  onPointerDown(ev: PointerEvent) {
    if (!this.events.length) return;
    this.dragging = true;
    this.startX = ev.clientX;
    this.startY = ev.clientY;
    (ev.target as Element).setPointerCapture(ev.pointerId);
  }

  onPointerMove(ev: PointerEvent) {
    if (!this.dragging) return;
    this.translateX = ev.clientX - this.startX;
    this.translateY = ev.clientY - this.startY;
    this.rotation = this.translateX / 20;
    this.applyTransform();
  }

  onPointerUp(ev: PointerEvent) {
    if (!this.dragging) return;
    this.dragging = false;
    const threshold = 120;
    const id = this.topEvent?.id;
    if (!id) return this.resetTransform();
    if (this.translateX > threshold) {
      this.animateOut(1);
      this.store.like(id);
    } else if (this.translateX < -threshold) {
      this.animateOut(-1);
      this.store.dislike(id);
    } else {
      this.resetTransform();
    }
  }

  get topEvent(): EventModel | undefined {
    return this.events && this.events.length ? this.events[0] : undefined;
  }

  // Return inline styles for a card at index i to create stack/deck effect.
  getCardStyle(i: number) {
    const offset = Math.min(i, 3);
    if (i === 0) {
      // top card — use dynamic transform from dragging
      return {
        transform: `translate(${this.translateX}px, ${this.translateY}px) rotate(${this.rotation}deg)`,
        transition: this.dragging ? 'none' : 'transform 200ms ease',
      } as any;
    }
    // behind cards — slightly scaled and shifted down
    const scale = 1 - offset * 0.03;
    const translateY = offset * 12; // px
    return {
      transform: `translateY(${translateY}px) scale(${scale})`,
    } as any;
  }

  // indicator opacity (0..1) based on translateX
  get indicatorOpacity() {
    const thr = 120;
    return Math.min(Math.abs(this.translateX) / thr, 1);
  }

  applyTransform() {
    if (!this.topCard) return;
    const el = this.topCard.nativeElement;
    el.style.transition = 'none';
    el.style.transform = `translate(${this.translateX}px, ${this.translateY}px) rotate(${this.rotation}deg)`;
  }

  resetTransform() {
    if (!this.topCard) return;
    const el = this.topCard.nativeElement;
    el.style.transition = 'transform 200ms ease';
    el.style.transform = '';
    this.translateX = 0;
    this.translateY = 0;
    this.rotation = 0;
  }

  animateOut(direction: number) {
    if (!this.topCard) return;
    const el = this.topCard.nativeElement;
    el.style.transition = 'transform 300ms ease-out';
    const offX = direction * (window.innerWidth + 200);
    const offY = this.translateY;
    el.style.transform = `translate(${offX}px, ${offY}px) rotate(${direction * 30}deg)`;
    // small timeout; store already removed event so next will render
    setTimeout(() => {
      this.translateX = 0;
      this.translateY = 0;
      this.rotation = 0;
    }, 320);
  }

  onLike() {
    const id = this.topEvent?.id;
    if (!id) return;
    this.animateOut(1);
    this.store.like(id);
  }

  onDislike() {
    const id = this.topEvent?.id;
    if (!id) return;
    this.animateOut(-1);
    this.store.dislike(id);
  }

  // optional middle action (e.g. save / super-like)
  onSave() {
    const id = this.topEvent?.id;
    if (!id) return;
    // add to saved list and remove from swipe queue
    const ev = this.topEvent;
    if (!ev) return;
    this.animateOut(1);
    this.saved.add(ev);
    this.store.remove(ev.id);
  }
}
