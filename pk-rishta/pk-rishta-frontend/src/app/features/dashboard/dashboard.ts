import { NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Complaint, ContactAccessRequest } from '../../core/models';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileAvatarComponent } from '../../shared/components/profile-avatar/profile-avatar';
import { GuidePopupComponent } from '../../shared/components/guide-popup/guide-popup';

type RequestTab = 'all' | 'pending' | 'approved' | 'rejected';
type ContactView = 'sent' | 'received';
type ComplaintTab = 'filed' | 'support';
type MainSection = 'contact' | 'complaints';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule, ProfileAvatarComponent, NgTemplateOutlet, GuidePopupComponent],
  template: `
    <app-guide-popup
      [open]="showAcceptGuide()"
      variant="contact-request"
      cancelLabel="Not now"
      confirmLabel="Accept — قبول کریں"
      (closed)="cancelAcceptGuide()"
      (confirmed)="confirmAcceptIncoming()"
    />
    <div class="bg-page-header">
      <div class="container">
        <h1 class="animate-fade-in-up">My Activity</h1>
        <p class="text-urdu animate-fade-in-up delay-1">میری سرگرمیاں</p>
      </div>
    </div>

    <div class="container page-section dash-page">
      <div class="hero-actions animate-fade-in-up">
        <button
          type="button"
          class="hero-card hero-card--contact"
          [class.active]="mainSection() === 'contact'"
          (click)="mainSection.set('contact')"
        >
          <div class="hero-card-bg"></div>
          <div class="hero-card-content">
            <span class="hero-icon-wrap">
              <span class="hero-icon">📞</span>
            </span>
            <div class="hero-text">
              <h3>Contact Requests</h3>
              <p>{{ pendingIncomingCount() }} received · {{ pendingCount() }} sent pending</p>
              <span class="hero-cta">View requests →</span>
            </div>
          </div>
        </button>
        <button
          type="button"
          class="hero-card hero-card--complaints"
          [class.active]="mainSection() === 'complaints'"
          (click)="mainSection.set('complaints')"
        >
          <div class="hero-card-bg"></div>
          <div class="hero-card-content">
            <span class="hero-icon-wrap">
              <span class="hero-icon">⚠️</span>
            </span>
            <div class="hero-text">
              <h3>Complaints</h3>
              <p>{{ filedComplaints().length + supportComplaints().length }} total</p>
              <span class="hero-cta">View complaints →</span>
            </div>
          </div>
        </button>
      </div>

      @if (mainSection() === 'contact') {
      @if (complaintMessage()) {
        <div class="alert" [class.alert-success]="!complaintError()" [class.alert-error]="complaintError()">
          {{ complaintMessage() }}
        </div>
      }
      <section class="hub-card card animate-fade-in-up delay-1">
        <div class="contact-view-toggle">
          <button type="button" [class.active]="contactView() === 'sent'" (click)="contactView.set('sent')">
            Sent <span class="tab-count">{{ requests().length }}</span>
          </button>
          <button type="button" [class.active]="contactView() === 'received'" (click)="contactView.set('received')">
            Received
            @if (pendingIncomingCount() > 0) {
              <span class="tab-count tab-count--alert">{{ pendingIncomingCount() }}</span>
            } @else {
              <span class="tab-count">{{ incoming().length }}</span>
            }
          </button>
        </div>

        @if (contactView() === 'received') {
          <div class="received-wrap" [class.received-locked]="incomingLocked()">
            @if (incomingLocked()) {
              <div class="received-overlay card">
                <span class="lock-icon">🔒</span>
                <h3>Complete your profile first</h3>
                <p>Incoming contact requests stay locked until your profile is complete — same as Search.</p>
                <a routerLink="/my-profile" class="btn btn-primary">Complete Your Profile</a>
              </div>
            }
            @if (!incoming().length) {
              <div class="hub-empty">
                <p>No incoming contact requests yet.</p>
              </div>
            } @else {
              <div class="request-list">
                @for (item of incoming(); track item.id) {
                  <div class="request-card">
                    <app-profile-avatar
                      [photo]="item.requester_photo"
                      [gender]="item.requester_gender"
                      [firstName]="item.requester_first_name"
                      [lastName]="item.requester_last_name"
                      size="sm"
                    />
                    <div class="request-info">
                      <h4>
                        @if (incomingLocked()) {
                          {{ item.requester_first_name }} {{ item.requester_last_name }}
                        } @else {
                          <a [routerLink]="['/profile', item.requester_profile_id]">
                            {{ item.requester_first_name }} {{ item.requester_last_name }}
                          </a>
                        }
                      </h4>
                      <p>{{ item.requester_age ? item.requester_age + ' yrs · ' : '' }}{{ item.requester_city }}</p>
                      <p class="request-date">Requested {{ formatDate(item.created_at) }}</p>
                      @if (!incomingLocked() && item.user_message) {
                        <p class="reject-reason">{{ item.user_message }}</p>
                      }
                      @if (!incomingLocked() && item.status === 'pending') {
                        <div class="incoming-actions">
                          <button
                            type="button"
                            class="btn btn-primary btn-sm"
                            [disabled]="respondingId() === item.id"
                            (click)="openAcceptGuide(item.id)"
                          >Accept</button>
                          <button
                            type="button"
                            class="btn btn-outline btn-sm"
                            [disabled]="respondingId() === item.id"
                            (click)="startDecline(item.id)"
                          >Decline</button>
                        </div>
                        @if (declineId() === item.id) {
                          <div class="decline-box">
                            <textarea
                              class="form-textarea"
                              rows="2"
                              placeholder="Reason for declining (required)"
                              [(ngModel)]="declineReason"
                            ></textarea>
                            <div class="incoming-actions">
                              <button type="button" class="btn btn-primary btn-sm" (click)="confirmDecline(item.id)">
                                Confirm Decline
                              </button>
                              <button type="button" class="btn btn-outline btn-sm" (click)="declineId.set(null)">Cancel</button>
                            </div>
                          </div>
                        }
                      } @else if (!incomingLocked() && item.status === 'rejected' && item.admin_message) {
                        <p class="reject-reason"><strong>Declined:</strong> {{ item.admin_message }}</p>
                      }
                      @if (!incomingLocked() && item.status === 'approved' && (!item.expires_at || !isExpired(item.expires_at))) {
                        @if (item.contacts?.length) {
                          <div class="contact-numbers" style="margin-top: 0.5rem;">
                            @for (c of item.contacts; track c.id || c.number) {
                              <a [href]="contactLink(c)" class="contact-chip">
                                {{ c.type === 'whatsapp' ? 'WhatsApp' : 'Phone' }}: {{ c.number }}
                              </a>
                            }
                          </div>
                        }
                        <button class="btn btn-danger btn-sm" style="margin-top: 0.5rem;" (click)="cancelSent(item.id)" [disabled]="cancellingId() === item.id">
                          {{ cancellingId() === item.id ? 'Cancelling...' : '✕ Cancel Connection' }}
                        </button>
                      }
                    </div>
                    <span class="badge" [class]="'badge-' + item.status">{{ item.status }}</span>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
        <div class="tab-bar tab-bar--top">
          <button type="button" class="tab-btn" [class.active]="requestTab() === 'all'" (click)="requestTab.set('all')">
            All <span class="tab-count">{{ requests().length }}</span>
          </button>
          <button type="button" class="tab-btn tab-btn--pending" [class.active]="requestTab() === 'pending'" (click)="requestTab.set('pending')">
            Pending <span class="tab-count">{{ pendingCount() }}</span>
          </button>
          <button type="button" class="tab-btn tab-btn--approved" [class.active]="requestTab() === 'approved'" (click)="requestTab.set('approved')">
            ✓ Approved <span class="tab-count">{{ approvedCount() }}</span>
          </button>
          <button type="button" class="tab-btn tab-btn--rejected" [class.active]="requestTab() === 'rejected'" (click)="requestTab.set('rejected')">
            ✗ Rejected <span class="tab-count">{{ rejectedCount() }}</span>
          </button>
        </div>

        @if (!filteredRequests().length) {
          <div class="hub-empty">
            @if (requestTab() === 'all' && !requests().length) {
              <p>No contact requests yet.</p>
              <a routerLink="/search" class="btn btn-primary btn-sm">Search Profiles</a>
            } @else {
              <p>No {{ requestTabLabel() }} requests.</p>
            }
          </div>
        } @else {
          <div class="request-list">
            @for (item of filteredRequests(); track item.id) {
              <div class="request-card">
                <app-profile-avatar
                  [photo]="item.target_photo"
                  [gender]="item.target_gender"
                  [firstName]="item.target_first_name"
                  [lastName]="item.target_last_name"
                  size="sm"
                />
                <div class="request-info">
                  <h4>
                    <a [routerLink]="['/profile', item.target_profile_id]">
                      {{ item.target_first_name }} {{ item.target_last_name }}
                    </a>
                  </h4>
                  <p>{{ item.target_age }} yrs · {{ item.target_city }}</p>
                  <p class="request-date">Requested {{ formatDate(item.created_at) }}</p>
                  @if ((item.status === 'rejected' || item.status === 'expired') && item.admin_message) {
                    <p class="reject-reason"><strong>{{ item.status === 'expired' ? 'Expired' : 'Rejected' }}:</strong> {{ item.admin_message }}</p>
                  }
                  @if (item.status === 'approved' && (!item.expires_at || !isExpired(item.expires_at))) {
                    <p class="approve-note">Contact visible — both parties can see each other's numbers</p>
                    @if (item.contacts?.length) {
                      <div class="contact-numbers">
                        @for (c of item.contacts; track c.id || c.number) {
                          <a [href]="contactLink(c)" class="contact-chip">
                            {{ c.type === 'whatsapp' ? 'WhatsApp' : 'Phone' }}: {{ c.number }}
                          </a>
                        }
                      </div>
                    }
                    <button class="btn btn-danger btn-sm" style="margin-top: 0.5rem;" (click)="cancelSent(item.id)" [disabled]="cancellingId() === item.id">
                      {{ cancellingId() === item.id ? 'Cancelling...' : '✕ Cancel Connection' }}
                    </button>
                  } @else if (item.status === 'approved' && item.expires_at && isExpired(item.expires_at)) {
                    <p class="approve-note expired-note">Access expired on {{ formatDate(item.expires_at) }}</p>
                  }
                </div>
                <span class="badge" [class]="'badge-' + displayStatus(item)">{{ displayStatus(item) }}</span>
              </div>
            }
          </div>
        }
        }
      </section>
      }

      @if (mainSection() === 'complaints') {
      <section class="hub-card card animate-fade-in-up delay-1">
        <div class="tab-bar tab-bar--top">
          <button type="button" class="tab-btn" [class.active]="complaintTab() === 'filed'" (click)="complaintTab.set('filed')">
            My Complaints <span class="tab-count">{{ filedComplaints().length }}</span>
          </button>
          <button type="button" class="tab-btn" [class.active]="complaintTab() === 'support'" (click)="complaintTab.set('support')">
            Admin Messages <span class="tab-count">{{ supportComplaints().length }}</span>
          </button>
        </div>

        @if (!activeComplaints().length) {
          <div class="hub-empty">
            @if (complaintTab() === 'filed') {
              <p>You have not filed any complaints yet.</p>
            } @else {
              <p>No messages from Hum Rishta Admin yet.</p>
            }
          </div>
        } @else {
          <div class="complaint-list">
            @for (c of activeComplaints(); track c.id) {
              <div class="complaint-card-inner">
                <ng-container
                  *ngTemplateOutlet="complaintTpl; context: {
                    $implicit: c,
                    isSupport: complaintTab() === 'support',
                    otherLabel: complaintTab() === 'filed' ? 'Against' : 'From',
                    otherName: complaintTab() === 'filed'
                      ? c.reported_first_name + ' ' + c.reported_last_name
                      : 'Hum Rishta Admin',
                    otherId: complaintTab() === 'filed' ? c.reported_profile_id : null
                  }"
                />
              </div>
            }
          </div>
        }
      </section>
      }

      @if (complaintMessage()) {
        <div class="alert" [class.alert-success]="!complaintError()" [class.alert-error]="complaintError()">
          {{ complaintMessage() }}
        </div>
      }
    </div>

    <ng-template #complaintTpl let-c let-otherLabel="otherLabel" let-otherName="otherName" let-otherId="otherId" let-isSupport="isSupport">
      <div class="complaint-header">
        <span class="badge" [class]="'badge-' + c.status">{{ c.status }}</span>
        <span class="complaint-category">{{ isSupport ? 'Hum Rishta Support' : formatCategory(c.category) }}</span>
        <span class="complaint-date">{{ formatDate(c.created_at) }}</span>
      </div>
      <p class="complaint-party">
        <strong>{{ otherLabel }}:</strong>
        @if (otherId) {
          <a [routerLink]="['/profile', otherId]">{{ otherName }}</a>
        } @else {
          <span>{{ otherName }}</span>
        }
      </p>
      <div class="message-thread">
        @for (msg of c.messages || []; track msg.id) {
          <div class="message-bubble" [class]="'msg-' + msg.sender_role">
            <span class="msg-role">{{ roleLabel(msg.sender_role, isSupport) }}</span>
            <p>{{ msg.message }}</p>
            <span class="msg-time">{{ formatDate(msg.created_at) }}</span>
          </div>
        }
      </div>
      @if (c.status !== 'dismissed') {
        <div class="reply-box">
          <textarea
            class="form-textarea"
            [(ngModel)]="replyText[c.id]"
            rows="2"
            placeholder="Write your reply..."
          ></textarea>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            (click)="sendReply(c.id)"
            [disabled]="replying() || !replyText[c.id]?.trim()"
          >
            Send Reply
          </button>
        </div>
      }
    </ng-template>
  `,
  styles: [`
    .dash-page { padding-top: 0; }

    .hero-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.75rem;
    }
    .hero-card {
      position: relative;
      display: block;
      width: 100%;
      border: 3px solid transparent;
      border-radius: var(--radius-lg);
      overflow: hidden;
      text-decoration: none;
      color: white;
      min-height: 140px;
      transition: var(--transition);
      box-shadow: var(--shadow-lg);
      cursor: pointer;
      text-align: left;
      font-family: inherit;
    }
    .hero-card:hover {
      transform: translateY(-5px) scale(1.01);
      box-shadow: 0 16px 48px rgba(107, 15, 26, 0.25);
      color: white;
    }
    .hero-card.active {
      border-color: var(--gold);
      box-shadow: 0 12px 40px rgba(201, 162, 39, 0.35), 0 0 0 1px rgba(255,255,255,0.2) inset;
      transform: translateY(-3px);
    }
    .hero-card-bg {
      position: absolute;
      inset: 0;
      transition: transform 0.4s ease;
    }
    .hero-card:hover .hero-card-bg,
    .hero-card.active .hero-card-bg { transform: scale(1.05); }
    .hero-card--contact .hero-card-bg {
      background: var(--gradient-wedding);
    }
    .hero-card--complaints .hero-card-bg {
      background: linear-gradient(135deg, #6B0F1A 0%, #9B1B30 30%, #C9A227 100%);
    }
    .hero-card-content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 1.15rem;
      padding: 1.5rem 1.6rem;
      height: 100%;
    }
    .hero-icon-wrap {
      width: 58px;
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.18);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.35);
      border-radius: 16px;
      flex-shrink: 0;
      transition: var(--transition);
    }
    .hero-card:hover .hero-icon-wrap {
      background: rgba(255, 255, 255, 0.28);
      transform: rotate(-4deg) scale(1.05);
    }
    .hero-icon { font-size: 1.75rem; line-height: 1; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
    .hero-text h3 {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
      text-shadow: 0 1px 3px rgba(0,0,0,0.15);
    }
    .hero-text p {
      font-size: 0.82rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }
    .hero-cta {
      display: inline-block;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      padding: 0.3rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50px;
      border: 1px solid rgba(255, 255, 255, 0.4);
      transition: var(--transition);
    }
    .hero-card:hover .hero-cta,
    .hero-card.active .hero-cta {
      background: rgba(255, 255, 255, 0.95);
      color: var(--primary-dark);
      border-color: white;
    }

    .hub-card {
      padding: 0;
      overflow: hidden;
      margin-bottom: 1.75rem;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }

    .tab-bar {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.5rem 0;
      flex-wrap: wrap;
      border-bottom: 1px solid var(--border);
    }
    .tab-bar--top {
      padding-top: 1.25rem;
      border-top: none;
    }
    .contact-view-toggle {
      display: flex;
      gap: 0.5rem;
      padding: 1.15rem 1.5rem 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    .contact-view-toggle button {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: #f9fafb;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .contact-view-toggle button.active {
      background: var(--primary);
      color: #fff;
      border-color: var(--primary);
    }
    .tab-count--alert {
      background: #fee2e2 !important;
      color: #b91c1c !important;
    }
    .incoming-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.65rem;
    }
    .decline-box {
      margin-top: 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .received-wrap {
      position: relative;
      min-height: 180px;
    }
    .received-locked .request-list,
    .received-locked .hub-empty {
      filter: blur(8px);
      opacity: 0.55;
      pointer-events: none;
      user-select: none;
    }
    .received-overlay {
      position: absolute;
      z-index: 5;
      top: 2rem;
      left: 50%;
      transform: translateX(-50%);
      width: min(420px, calc(100% - 2rem));
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 16px 40px rgba(46, 6, 16, 0.18);
    }
    .received-overlay h3 { margin: 0.5rem 0 0.35rem; }
    .received-overlay p { color: var(--text-muted); margin-bottom: 1rem; }
    .lock-icon { font-size: 1.75rem; }
    .badge-expired { background: #f3f4f6; color: #6b7280; }
    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 1.1rem;
      border: 2px solid transparent;
      border-radius: 50px;
      background: #f9fafb;
      color: var(--text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
      margin-bottom: -1px;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
    .tab-btn:hover { background: #f3f4f6; color: var(--text); }
    .tab-btn.active {
      background: white;
      color: var(--primary);
      border-color: var(--border);
      border-bottom-color: white;
    }
    .tab-btn--approved.active { color: #15803d; }
    .tab-btn--rejected.active { color: #b91c1c; }
    .tab-btn--against.active { color: #b45309; }
    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.35rem;
      height: 1.35rem;
      padding: 0 0.35rem;
      border-radius: 50px;
      background: rgba(0,0,0,0.06);
      font-size: 0.72rem;
    }
    .tab-btn.active .tab-count { background: rgba(155, 27, 48, 0.1); }

    .hub-empty {
      padding: 2.5rem 1.5rem;
      text-align: center;
      color: var(--text-muted);
    }
    .hub-empty p { margin-bottom: 1rem; }

    .request-list, .complaint-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding: 1rem 1.5rem 1.5rem;
    }
    .request-card, .complaint-card-inner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.1rem 0;
      border-bottom: 1px solid var(--border);
    }
    .request-card:last-child, .complaint-card-inner:last-child { border-bottom: none; padding-bottom: 0; }
    .request-info { flex: 1; min-width: 0; }
    .request-info h4 { font-size: 1rem; }
    .request-info h4 a { color: inherit; text-decoration: none; }
    .request-info h4 a:hover { color: var(--primary); }
    .request-info p { font-size: 0.85rem; color: var(--text-muted); }
    .request-date { font-size: 0.8rem !important; }
    .reject-reason { color: #b91c1c !important; margin-top: 0.35rem; }
    .approve-note { color: #15803d !important; margin-top: 0.35rem; }
    .expired-note { color: #6b7280 !important; }
    .contact-numbers { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem; }
    .contact-chip {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #15803d;
      text-decoration: none;
      transition: background 0.2s ease;
    }
    .contact-chip:hover { background: #dcfce7; color: #166534; }

    .badge-approved { background: #dcfce7; color: #15803d; }
    .badge-rejected { background: #fee2e2; color: #b91c1c; }
    .badge-pending { background: #fef3c7; color: #b45309; }
    .badge-expired { background: #f3f4f6; color: #6b7280; }
    .badge-resolved { background: #dbeafe; color: #1d4ed8; }
    .badge-dismissed { background: #f3f4f6; color: #6b7280; }

    .complaint-header { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-bottom: 0.5rem; width: 100%; }
    .complaint-category { font-weight: 600; font-size: 0.9rem; }
    .complaint-date { font-size: 0.8rem; color: var(--text-muted); margin-left: auto; }
    .complaint-party { font-size: 0.9rem; margin-bottom: 0.75rem; width: 100%; }
    .complaint-party a { color: var(--primary); text-decoration: none; font-weight: 600; }
    .complaint-card-inner { flex-direction: column; }
    .message-thread { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; width: 100%; }
    .message-bubble {
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      font-size: 0.88rem;
      max-width: 95%;
    }
    .msg-admin { background: #ede9fe; border-left: 3px solid #7c3aed; align-self: flex-start; }
    .msg-reporter { background: #fef3c7; border-left: 3px solid #d97706; align-self: flex-end; }
    .msg-reported { background: #dbeafe; border-left: 3px solid #2563eb; align-self: flex-end; }
    .msg-role { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; display: block; margin-bottom: 0.2rem; }
    .msg-time { font-size: 0.72rem; color: var(--text-muted); display: block; margin-top: 0.25rem; }
    .reply-box { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border); width: 100%; }
    .reply-box .form-textarea { min-height: 60px; }

    .alert { margin-top: 0.5rem; padding: 0.75rem 1rem; border-radius: 8px; }
    .alert-success { background: #dcfce7; color: #15803d; }
    .alert-error { background: #fee2e2; color: #b91c1c; }

    @media (max-width: 768px) {
      .hero-actions { grid-template-columns: 1fr; }
      .hero-card { min-height: auto; }
      .tab-bar { padding: 0.75rem 1rem 0; }
      .request-list, .complaint-list { padding: 0.75rem 1rem 1rem; }
      .tab-btn { font-size: 0.8rem; padding: 0.5rem 0.85rem; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  readonly auth = inject(AuthService);

  requests = signal<ContactAccessRequest[]>([]);
  incoming = signal<ContactAccessRequest[]>([]);
  incomingLocked = signal(false);
  pendingCount = signal(0);
  filedComplaints = signal<Complaint[]>([]);
  supportComplaints = signal<Complaint[]>([]);
  requestTab = signal<RequestTab>('all');
  contactView = signal<ContactView>('sent');
  complaintTab = signal<ComplaintTab>('filed');
  mainSection = signal<MainSection>('contact');
  replying = signal(false);
  respondingId = signal<string | null>(null);
  declineId = signal<string | null>(null);
  cancellingId = signal<string | null>(null);
  showAcceptGuide = signal(false);
  pendingAcceptId = signal<string | null>(null);
  declineReason = '';
  complaintMessage = signal('');
  complaintError = signal(false);
  replyText: Record<string, string> = {};

  pendingIncomingCount = computed(() =>
    this.incoming().filter((r) => r.status === 'pending').length
  );

  approvedCount = computed(() =>
    this.requests().filter((r) => r.status === 'approved' && (!r.expires_at || !this.isExpired(r.expires_at))).length
  );

  rejectedCount = computed(() =>
    this.requests().filter((r) => r.status === 'rejected' || r.status === 'expired').length
  );

  filteredRequests = computed(() => {
    const list = this.requests();
    const tab = this.requestTab();
    if (tab === 'all') return list;
    if (tab === 'pending') return list.filter((r) => r.status === 'pending');
    if (tab === 'approved') {
      return list.filter((r) => r.status === 'approved' && (!r.expires_at || !this.isExpired(r.expires_at)));
    }
    return list.filter((r) =>
      r.status === 'rejected'
      || r.status === 'expired'
      || (r.status === 'approved' && r.expires_at && this.isExpired(r.expires_at))
    );
  });

  activeComplaints = computed(() =>
    this.complaintTab() === 'filed' ? this.filedComplaints() : this.supportComplaints()
  );

  ngOnInit(): void {
    this.loadSentRequests();
    this.loadIncomingRequests();
    this.loadComplaints();
  }

  loadSentRequests(): void {
    this.profileService.getMyContactRequests().subscribe({
      next: (res) => {
        this.requests.set(res.data);
        this.pendingCount.set(res.data.filter((r) => r.status === 'pending').length);
      },
    });
  }

  loadIncomingRequests(): void {
    this.profileService.getIncomingContactRequests().subscribe({
      next: (res) => {
        const list = res.data || [];
        const locked = !!(res as { locked?: boolean }).locked
          || !this.auth.currentUser()?.is_profile_complete;
        this.incoming.set(list);
        this.incomingLocked.set(locked);
        if (list.some((r) => r.status === 'pending')) {
          this.contactView.set('received');
        }
      },
      error: () => {
        this.incoming.set([]);
        this.incomingLocked.set(!this.auth.currentUser()?.is_profile_complete);
      },
    });
  }

  startDecline(id: string): void {
    this.declineId.set(id);
    this.declineReason = '';
  }

  openAcceptGuide(id: string): void {
    this.pendingAcceptId.set(id);
    this.showAcceptGuide.set(true);
  }

  cancelAcceptGuide(): void {
    this.showAcceptGuide.set(false);
    this.pendingAcceptId.set(null);
  }

  confirmAcceptIncoming(): void {
    const id = this.pendingAcceptId();
    this.showAcceptGuide.set(false);
    this.pendingAcceptId.set(null);
    if (!id) return;
    this.respondIncoming(id, 'approve');
  }

  confirmDecline(id: string): void {
    if (!this.declineReason.trim()) {
      this.complaintMessage.set('Please provide a reason for declining');
      this.complaintError.set(true);
      return;
    }
    this.respondIncoming(id, 'reject', this.declineReason.trim());
  }

  respondIncoming(id: string, action: 'approve' | 'reject', message?: string): void {
    this.respondingId.set(id);
    this.profileService.respondToContactRequest(id, action, message).subscribe({
      next: () => {
        this.respondingId.set(null);
        this.declineId.set(null);
        this.declineReason = '';
        this.complaintMessage.set(action === 'approve' ? 'Request accepted' : 'Request declined');
        this.complaintError.set(false);
        this.loadIncomingRequests();
        this.loadSentRequests();
      },
      error: (err) => {
        this.respondingId.set(null);
        this.complaintMessage.set(err.error?.message || 'Failed to respond');
        this.complaintError.set(true);
      },
    });
  }

  cancelSent(id: string): void {
    this.cancellingId.set(id);
    this.profileService.cancelContactRequest(id).subscribe({
      next: () => {
        this.cancellingId.set(null);
        this.complaintMessage.set('Connection cancelled');
        this.complaintError.set(false);
        this.loadSentRequests();
        this.loadIncomingRequests();
      },
      error: (err) => {
        this.cancellingId.set(null);
        this.complaintMessage.set(err.error?.message || 'Failed to cancel');
        this.complaintError.set(true);
      },
    });
  }

  loadComplaints(): void {
    this.profileService.getMyComplaints().subscribe({
      next: (res) => {
        this.filedComplaints.set(res.data.filed || []);
        this.supportComplaints.set(res.data.support || []);
      },
    });
  }

  requestTabLabel(): string {
    const labels: Record<RequestTab, string> = {
      all: '',
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
    };
    return labels[this.requestTab()];
  }

  sendReply(complaintId: string): void {
    const text = this.replyText[complaintId]?.trim();
    if (!text) return;

    this.replying.set(true);
    this.profileService.replyToComplaint(complaintId, text).subscribe({
      next: () => {
        this.replying.set(false);
        this.replyText[complaintId] = '';
        this.complaintMessage.set('Reply sent successfully');
        this.complaintError.set(false);
        this.loadComplaints();
      },
      error: (err) => {
        this.replying.set(false);
        this.complaintMessage.set(err.error?.message || 'Failed to send reply');
        this.complaintError.set(true);
      },
    });
  }

  roleLabel(role: string, isSupport = false): string {
    if (role === 'admin') return 'Admin';
    if (isSupport) return 'You';
    if (role === 'reporter') return 'You';
    if (role === 'reported') return 'You';
    return role;
  }

  formatCategory(cat: string): string {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  displayStatus(item: ContactAccessRequest): string {
    if (item.status === 'approved' && item.expires_at && this.isExpired(item.expires_at)) {
      return 'expired';
    }
    return item.status;
  }

  isExpired(expiresAt: string | undefined): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) <= new Date();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  }

  contactLink(c: { type: string; number: string }): string {
    if (c.type === 'whatsapp') {
      return `https://wa.me/${c.number.replace(/\D/g, '')}`;
    }
    return `tel:${c.number}`;
  }
}
