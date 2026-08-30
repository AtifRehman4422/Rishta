import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { Profile, PartnerPreferences, ContactAccessStatus } from '../../core/models';
import { formatHeightCm } from '../../core/utils/height';
import { formatProfileLocation, isOverseasProvince } from '../../core/constants/pakistan-locations';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import { AdminService } from '../../core/services/admin.service';
import { FavoritesService } from '../../core/services/favorites.service';
import { ProfileAvatarComponent } from '../../shared/components/profile-avatar/profile-avatar';
import { FormErrorState } from '../../core/utils/form-error-state';
import { firstError, validateComplaint } from '../../core/utils/validation';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';
import {
  aliveLabel,
  familyCounts,
  familyDetailsDisplay,
  isStructuredFamilyDetails,
  marriedLabel,
  parseFamilyDetails,
  siblingOrderLabel,
  type FamilyDetails,
  type FamilySibling,
} from '../../core/utils/family-details';

@Component({
  selector: 'app-profile-detail',
  imports: [RouterLink, FormsModule, ProfileAvatarComponent, FieldErrorComponent, AdSlotComponent],
  template: `
    @if (loading()) {
      <div class="loading-center"><div class="spinner"></div></div>
    } @else if (!canViewThisProfile) {
      <div class="container" style="padding: 3rem 1rem;">
        <div class="card" style="max-width: 480px; margin: 0 auto; text-align: center; padding: 2rem;">
          <span style="font-size: 2.4rem;">🔒</span>
          @if (!auth.isLoggedIn()) {
            <h3>Login to view this profile</h3>
            <p>Profiles are only visible to registered members with a complete profile.</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; margin-top: 1rem;">
              <a routerLink="/login" class="btn btn-primary">Login</a>
              <a routerLink="/register" class="btn btn-outline">Register Free</a>
            </div>
          } @else {
            <h3>Complete your profile first</h3>
            <p>Fill all required fields to view other members.</p>
            <a routerLink="/my-profile" class="btn btn-primary" style="margin-top: 1rem;">Complete Your Profile</a>
          }
        </div>
      </div>
    } @else if (profile()) {
      <div class="profile-page">
        <div class="profile-hero bg-page-header">
          <div class="container">
            <div class="profile-header animate-fade-in-up">
              <app-profile-avatar
                [photo]="profile()!.profile_photo"
                [gender]="profile()!.gender"
                [firstName]="profile()!.first_name"
                [lastName]="profile()!.last_name"
                size="lg"
              />
              <div class="profile-info">
                <h1>{{ profile()!.first_name }} {{ profile()!.last_name }}</h1>
                <p class="profile-meta">{{ profile()!.age }} years · {{ formatProfileLocation(profile()!) }}</p>
                <div class="badges">
                  @if (profile()!.is_verified) { <span class="badge badge-verified">✓ Verified</span> }
                  @if (auth.isAdmin() && profile()!.admin_rating) {
                    <span class="rating-stars" title="Attractiveness">{{ ratingStars(profile()!.admin_rating) }}</span>
                  }
                  <span class="badge">{{ profile()!.gender === 'male' ? 'Male' : 'Female' }}</span>
                </div>
              </div>
              @if (!auth.isAdmin() && contactStatus() !== 'own') {
                <div class="profile-actions">
                  <button
                    type="button"
                    class="fav-hero-btn"
                    [class.is-on]="favorites.isFavorite(profile()!.id)"
                    [attr.aria-label]="favorites.isFavorite(profile()!.id) ? 'Remove from favorites' : 'Save to favorites'"
                    (click)="toggleFavorite()"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" [attr.fill]="favorites.isFavorite(profile()!.id) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <span>{{ favorites.isFavorite(profile()!.id) ? 'Saved' : 'Save' }}</span>
                  </button>
                  @if (auth.isLoggedIn()) {
                  <button type="button" class="complain-btn" (click)="openComplaintModal()">
                    <span class="complain-icon-wrap">
                      <svg class="complain-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      </svg>
                    </span>
                    <span class="complain-text">
                      <span class="complain-title">Report Issue</span>
                      <span class="complain-sub">شکایت درج کریں</span>
                    </span>
                  </button>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <div class="container profile-content">
          @if (message()) {
            <div class="alert" [class.alert-success]="messageType() === 'success'" [class.alert-error]="messageType() === 'error'" [class.alert-info]="messageType() === 'info'">
              {{ message() }}
            </div>
          }

          @if (auth.isAdmin()) {
            <div class="status-card card admin-view-card animate-fade-in-up">
              <h3>🔐 Admin View — Full Profile Data</h3>
              @if (profile()!.user_email) {
                <p class="admin-meta"><strong>Account email:</strong> {{ profile()!.user_email }}</p>
              }
              @if (profile()!.contacts?.length) {
                <div class="contact-list">
                  @for (c of profile()!.contacts!; track c.id || c.number) {
                    <div class="contact-item">
                      <span class="contact-type">{{ c.type === 'whatsapp' ? 'WhatsApp' : 'Phone' }}</span>
                      <a [href]="contactLink(c)" class="contact-number">{{ c.number }}</a>
                    </div>
                  }
                </div>
              } @else {
                <p class="process-hint">No contact numbers on this profile.</p>
              }
              <div class="request-limit-row">
                <label for="request-limit">This user can send (pending slots, default 3)</label>
                <select
                  id="request-limit"
                  class="form-select"
                  [(ngModel)]="requestLimitDraft"
                  name="requestLimitDraft"
                >
                  @for (n of requestSlotOptions; track n) {
                    <option [ngValue]="n">{{ n }}{{ n === 3 ? ' — default' : '' }}</option>
                  }
                </select>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  (click)="saveRequestLimit()"
                  [disabled]="savingRequestLimit()"
                >
                  {{ savingRequestLimit() ? 'Saving...' : 'Save slots' }}
                </button>
              </div>
              <p class="process-hint">How many unanswered contact requests this member can send at once. Extra slots apply only to this profile.</p>
              <div class="admin-actions">
                <a routerLink="/admin/profiles" class="btn btn-outline btn-sm admin-back-btn">← Manage Profiles</a>
              </div>
            </div>
          }

          @if (auth.isLoggedIn() && !auth.isAdmin() && contactStatus() !== 'own' && canRequestContact()) {
            <div class="cta-card card animate-fade-in-up">
              <div class="cta-text">
                <h3>Interested in this profile?</h3>
                <p>Request their contact number. The profile owner and admin can approve your request.</p>
                @if (pendingRemaining() !== null) {
                  <p class="quota-hint">{{ pendingRemaining() }} of {{ pendingLimit() }} pending request slots remaining. Unanswered requests expire after 2 days.</p>
                }
              </div>
              <button class="btn btn-primary btn-lg" (click)="requestContact()" [disabled]="requesting()">
                {{ requesting() ? 'Sending Request...' : '📞 Request Contact Number' }}
              </button>
            </div>
          }

          @if (auth.isLoggedIn() && !auth.isAdmin() && contactStatus() !== 'own' && !canRequestContact() && isPendingLimitReached()) {
            <div class="status-card card warn-card animate-fade-in-up">
              <h3>⏳ Pending Limit Reached</h3>
              <p>You already have {{ pendingLimit() }} pending contact requests. Wait for a response, or for a pending request to expire after 2 days.</p>
            </div>
          }

          @if (!auth.isLoggedIn()) {
            <div class="cta-card card animate-fade-in-up">
              <div class="cta-text">
                <h3>Want to connect?</h3>
                <p>Login or register to request this profile's contact number.</p>
              </div>
              <div class="cta-btns">
                <a routerLink="/login" class="btn btn-primary">Login</a>
                <a routerLink="/register" class="btn btn-outline">Register</a>
              </div>
            </div>
          }

          @if (accessStatus()?.status === 'pending') {
            <div class="status-card card info-card animate-fade-in-up">
              <h3>📋 Request Submitted</h3>
              <p>Your request was sent to the profile owner and admin. You will be notified when they respond.</p>
              <p class="process-hint">If there is no response within 2 days, the request expires and you can request someone else. Check My Activity for updates.</p>
            </div>
          }

          @if (accessStatus()?.status === 'rejected') {
            <div class="status-card card reject-card animate-fade-in-up">
              <h3>❌ Request Declined</h3>
              @if (accessStatus()!.admin_message) {
                <p><strong>Reason:</strong> {{ accessStatus()!.admin_message }}</p>
              }
              <p class="process-hint">You can request contact from another profile.</p>
            </div>
          }

          @if (accessStatus()?.status === 'approved' && accessStatus()!.contacts?.length) {
            <div class="status-card card contact-card animate-fade-in-up">
              <h3>📞 Contact Number</h3>
              <p class="contact-shared-note">Both you and this profile can see each other's numbers. Either party can cancel the connection.</p>
              <div class="contact-list">
                @for (c of accessStatus()!.contacts!; track c.id || c.number) {
                  <div class="contact-item">
                    <span class="contact-type">{{ c.type === 'whatsapp' ? 'WhatsApp' : 'Phone' }}</span>
                    <a [href]="contactLink(c)" class="contact-number">{{ c.number }}</a>
                  </div>
                }
              </div>
              <div style="margin-top: 1rem;">
                <button class="btn btn-danger btn-sm" (click)="cancelConnection()" [disabled]="cancelling()">
                  {{ cancelling() ? 'Cancelling...' : '✕ Cancel Connection' }}
                </button>
              </div>
            </div>
          } @else if (accessStatus()?.status === 'approved' && !accessStatus()!.contacts?.length) {
            <div class="status-card card warn-card animate-fade-in-up">
              <h3>📞 Approved — Contact Pending</h3>
              <p>This profile has not added contact numbers yet. Please check back later or contact admin.</p>
            </div>
          }

          @if (accessStatus()?.status === 'expired') {
            <div class="status-card card warn-card animate-fade-in-up">
              <h3>⏰ Contact Access Expired</h3>
              <p>Your contact access has ended. Submit a new request if needed.</p>
            </div>
          }

          <div class="detail-ad detail-ad-top">
            <app-ad-slot [slot]="adSlots.profileDetailTop" format="horizontal" />
          </div>

          <div class="content-grid">
            <div class="main-col">
              @if (profile()!.about_me) {
                <div class="detail-card card animate-fade-in-up">
                  <h3>About</h3>
                  <p>{{ profile()!.about_me }}</p>
                </div>
              }
              @if (hasPartnerRequirements(profile()!.partner_preferences)) {
                <div class="detail-card card animate-fade-in-up delay-1">
                  <h3>Partner Requirements</h3>
                  <div class="info-list">
                    @if (profile()!.partner_preferences!.min_age || profile()!.partner_preferences!.max_age) {
                      <div class="info-item">
                        <span>Age Range</span>
                        <strong>{{ profile()!.partner_preferences!.min_age || '?' }} – {{ profile()!.partner_preferences!.max_age || '?' }} years</strong>
                      </div>
                    }
                    @if (profile()!.partner_preferences!.min_height_cm || profile()!.partner_preferences!.max_height_cm) {
                      <div class="info-item">
                        <span>Height</span>
                        <strong>
                          @if (profile()!.partner_preferences!.min_height_cm && profile()!.partner_preferences!.max_height_cm) {
                            {{ formatHeightCm(profile()!.partner_preferences!.min_height_cm) }} – {{ formatHeightCm(profile()!.partner_preferences!.max_height_cm) }}
                          } @else if (profile()!.partner_preferences!.min_height_cm) {
                            Min {{ formatHeightCm(profile()!.partner_preferences!.min_height_cm) }}
                          } @else {
                            Max {{ formatHeightCm(profile()!.partner_preferences!.max_height_cm) }}
                          }
                        </strong>
                      </div>
                    }
                    @if (profile()!.partner_preferences!.religion) {
                      <div class="info-item"><span>Religion</span><strong>{{ profile()!.partner_preferences!.religion }}</strong></div>
                    }
                    @if (profile()!.partner_preferences!.sect) {
                      <div class="info-item"><span>Sect</span><strong>{{ profile()!.partner_preferences!.sect }}</strong></div>
                    }
                    @if (profile()!.partner_preferences!.caste) {
                      <div class="info-item"><span>Caste</span><strong>{{ formatMultiPref(profile()!.partner_preferences!.caste) }}</strong></div>
                    }
                    @if (profile()!.partner_preferences!.province) {
                      <div class="info-item">
                        <span>State</span>
                        <strong>{{ formatMultiPref(profile()!.partner_preferences!.province) }}</strong>
                      </div>
                    }
                    @if (profile()!.partner_preferences!.country) {
                      <div class="info-item"><span>Country</span><strong>{{ formatMultiPref(profile()!.partner_preferences!.country) }}</strong></div>
                    }
                    @if (profile()!.partner_preferences!.city) {
                      <div class="info-item"><span>City</span><strong>{{ formatMultiPref(profile()!.partner_preferences!.city) }}</strong></div>
                    }
                    @if (profile()!.partner_preferences!.education) {
                      <div class="info-item"><span>Education</span><strong>{{ formatMultiPref(profile()!.partner_preferences!.education) }}</strong></div>
                    }
                    @if (profile()!.partner_preferences!.profession) {
                      <div class="info-item"><span>Profession</span><strong>{{ formatMultiPref(profile()!.partner_preferences!.profession) }}</strong></div>
                    }
                    @if (profile()!.partner_preferences!.marital_status) {
                      <div class="info-item"><span>Marital Status</span><strong>{{ formatStatus(profile()!.partner_preferences!.marital_status) }}</strong></div>
                    }
                  </div>
                  @if (profile()!.partner_preferences!.requirements_notes) {
                    <p class="req-notes">{{ profile()!.partner_preferences!.requirements_notes }}</p>
                  }
                </div>
              }
              @if (familyView()) {
                <div class="detail-card card animate-fade-in-up delay-2">
                  <h3>Family Details</h3>
                  @if (structuredFamily()) {
                    <div class="family-view">
                      <div class="family-parent-grid">
                        <div class="family-parent-card">
                          <span>Father</span>
                          <strong>{{ structuredFamily()!.father.name || 'Name not added' }}</strong>
                          <p>{{ aliveLabel(structuredFamily()!.father.alive) || '—' }}{{ structuredFamily()!.father.profession ? ' · ' + structuredFamily()!.father.profession : '' }}</p>
                        </div>
                        <div class="family-parent-card">
                          <span>Mother</span>
                          <strong>{{ structuredFamily()!.mother.name || 'Name not added' }}</strong>
                          <p>{{ aliveLabel(structuredFamily()!.mother.alive) || '—' }}{{ structuredFamily()!.mother.profession ? ' · ' + structuredFamily()!.mother.profession : '' }}</p>
                        </div>
                      </div>
                      @if (brotherCounts().total) {
                        <div class="family-chip">Brothers: {{ brotherCounts().total }} total · {{ brotherCounts().married }} married</div>
                        <div class="info-list family-sib-list">
                          @for (b of structuredFamily()!.brothers; track b.id; let i = $index) {
                            <div class="info-item">
                              <span>Brother {{ i + 1 }}</span>
                              <strong>{{ siblingLine(b) }}</strong>
                            </div>
                          }
                        </div>
                      }
                      @if (sisterCounts().total) {
                        <div class="family-chip">Sisters: {{ sisterCounts().total }} total · {{ sisterCounts().married }} married</div>
                        <div class="info-list family-sib-list">
                          @for (s of structuredFamily()!.sisters; track s.id; let i = $index) {
                            <div class="info-item">
                              <span>Sister {{ i + 1 }}</span>
                              <strong>{{ siblingLine(s) }}</strong>
                            </div>
                          }
                        </div>
                      }
                    </div>
                  } @else {
                    <p class="family-legacy">{{ familyView() }}</p>
                  }
                </div>
              }
            </div>
            <div class="side-col">
              <div class="detail-card card animate-fade-in-up">
                <h3>Personal Info</h3>
                <div class="info-list">
                  <div class="info-item"><span>Age</span><strong>{{ profile()!.age }} years</strong></div>
                  <div class="info-item"><span>Height</span><strong>{{ formatHeightCm(profile()!.height_cm) }}</strong></div>
                  <div class="info-item"><span>Weight</span><strong>{{ profile()!.weight_kg ? profile()!.weight_kg + ' kg' : '---' }}</strong></div>
                  <div class="info-item"><span>Marital Status</span><strong>{{ profile()!.marital_status ? formatStatus(profile()!.marital_status) : '---' }}</strong></div>
                  <div class="info-item"><span>Color</span><strong>{{ profile()!.color || '---' }}</strong></div>
                  <div class="info-item"><span>Disability</span><strong>{{ profile()!.disability || '---' }}</strong></div>
                  <div class="info-item"><span>Caste</span><strong>{{ profile()!.caste || '---' }}</strong></div>
                  <div class="info-item"><span>Religion</span><strong>{{ profile()!.religion || '---' }}</strong></div>
                  <div class="info-item"><span>Sect</span><strong>{{ profile()!.sect || '---' }}</strong></div>
                  <div class="info-item"><span>Languages</span><strong>{{ profile()!.languages || '---' }}</strong></div>
                  @if (profile()!.guardian_type || profile()!.guardian_name) {
                    <div class="info-item">
                      <span>{{ profile()!.guardian_type || 'Guardian' }}</span>
                      <strong>{{ profile()!.guardian_name || '---' }}</strong>
                    </div>
                  }
                </div>
              </div>
              <div class="detail-card card animate-fade-in-up delay-1">
                <h3>Education & Career</h3>
                <div class="info-list">
                  <div class="info-item"><span>Education</span><strong>{{ profile()!.education || '---' }}</strong></div>
                  <div class="info-item"><span>Profession</span><strong>{{ profile()!.profession || '---' }}</strong></div>
                </div>
              </div>
              <div class="detail-card card animate-fade-in-up delay-2">
                <h3>Location</h3>
                <div class="info-list">
                  <div class="info-item"><span>City</span><strong>{{ profile()!.city || '---' }}</strong></div>
                  @if (isOverseasProvince(profile()!.province)) {
                    <div class="info-item"><span>Country</span><strong>{{ profile()!.country }}</strong></div>
                  } @else {
                    <div class="info-item"><span>Province</span><strong>{{ profile()!.province || '---' }}</strong></div>
                  }
                  <div class="info-item"><span>Own House (Pakistan)</span><strong>{{ profile()!.house_own_location || '---' }}</strong></div>
                  <div class="info-item"><span>Rented House (Pakistan)</span><strong>{{ profile()!.house_rent_location || '---' }}</strong></div>
                  @if (profile()!.abroad_country) {
                    <div class="info-item"><span>Abroad Country</span><strong>{{ profile()!.abroad_country }}</strong></div>
                    <div class="info-item"><span>Own House (Abroad)</span><strong>{{ profile()!.abroad_house_own_location || '---' }}</strong></div>
                    <div class="info-item"><span>Rented House (Abroad)</span><strong>{{ profile()!.abroad_house_rent_location || '---' }}</strong></div>
                  }
                </div>
              </div>
              @if (!auth.isLoggedIn()) {
                <div class="detail-card card login-prompt">
                  <p>Login to request contact number through admin verification.</p>
                  <a routerLink="/login" class="btn btn-primary btn-sm">Login</a>
                </div>
              }
            </div>
          </div>
          <div class="detail-ad detail-ad-bottom">
            <app-ad-slot [slot]="adSlots.profileDetailBottom" format="horizontal" />
          </div>
          <div style="margin-top: 2rem">
            <a routerLink="/search" class="btn btn-outline">← Back to Search</a>
          </div>
        </div>
      </div>

      @if (showComplaintModal()) {
        <div class="modal-overlay" (click)="showComplaintModal.set(false)">
          <div class="modal card complain-modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <span class="modal-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </span>
              <div>
                <h3>Report This Profile</h3>
                <p class="modal-sub">Admin will review your complaint confidentially.</p>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select
                class="form-select"
                [class.input-invalid]="complaintErrors.show('category')"
                [(ngModel)]="complaintCategory"
                (ngModelChange)="complaintErrors.clear('category')"
              >
                <option value="fake_profile">Fake Profile</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="harassment">Harassment</option>
                <option value="misleading_info">Misleading Information</option>
                <option value="other">Other</option>
              </select>
              <app-field-error [message]="complaintErrors.message('category')" />
            </div>
            <div class="form-group">
              <label class="form-label">Description *</label>
              <textarea
                class="form-textarea"
                [class.input-invalid]="complaintErrors.show('description')"
                [(ngModel)]="complaintDescription"
                rows="4"
                placeholder="Describe your complaint in detail (min 20 characters)..."
                (blur)="complaintErrors.touch('description')"
                (ngModelChange)="complaintErrors.clear('description')"
              ></textarea>
              <app-field-error [message]="complaintErrors.message('description')" />
            </div>
            @if (complaintMessage()) {
              <div class="alert" [class.alert-success]="complaintMessageType() === 'success'" [class.alert-error]="complaintMessageType() === 'error'">
                {{ complaintMessage() }}
              </div>
            }
            <div class="modal-actions">
              <button class="btn btn-outline" (click)="showComplaintModal.set(false)">Cancel</button>
              <button class="btn btn-danger" (click)="submitComplaint()" [disabled]="complaintSubmitting()">
                {{ complaintSubmitting() ? 'Submitting...' : 'Submit Report' }}
              </button>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .profile-hero { padding: 3rem 0; color: white; }
    .profile-header { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .profile-info h1 { font-size: 2rem; margin-bottom: 0.25rem; }
    .profile-meta { opacity: 0.85; margin-bottom: 0.75rem; }
    .badges { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; }
    .rating-stars {
      color: #FFD700;
      font-size: 1.25rem;
      letter-spacing: 0.06em;
      line-height: 1;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    .profile-actions { margin-left: auto; display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }
    .fav-hero-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 1rem 0.5rem 0.55rem;
      border-radius: 50px;
      border: 1.5px solid rgba(255, 193, 203, 0.55);
      background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%);
      color: #fff;
      font-family: var(--font);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.25s ease;
    }
    .fav-hero-btn svg { width: 20px; height: 20px; }
    .fav-hero-btn.is-on { color: #FFC1CB; border-color: #FFC1CB; }
    .fav-hero-btn:hover { transform: translateY(-2px); background: rgba(255, 255, 255, 0.16); }
    .request-btn { font-weight: 700; min-width: 220px; text-align: center; }
    .complain-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.55rem 1.1rem 0.55rem 0.55rem;
      border-radius: 50px;
      border: 1.5px solid rgba(252, 211, 77, 0.55);
      background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%);
      color: #fff;
      font-family: var(--font);
      cursor: pointer;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.25s ease;
    }
    .complain-btn:hover {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.28) 0%, rgba(245, 158, 11, 0.18) 100%);
      border-color: #fcd34d;
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.22);
    }
    .complain-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.45);
    }
    .complain-icon { width: 18px; height: 18px; color: #78350f; }
    .complain-text { display: flex; flex-direction: column; align-items: flex-start; line-height: 1.2; text-align: left; }
    .complain-title { font-size: 0.88rem; font-weight: 700; letter-spacing: 0.01em; }
    .complain-sub { font-size: 0.72rem; opacity: 0.85; margin-top: 0.1rem; }
    .cta-card {
      display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
      padding: 1.5rem; margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #fff 0%, #FFF8F3 100%);
      border: 2px solid rgba(212, 175, 55, 0.4);
    }
    .cta-card h3 { font-size: 1.1rem; margin-bottom: 0.35rem; color: var(--primary); }
    .cta-card p { font-size: 0.9rem; color: var(--text-muted); margin: 0; }
    .cta-card .urdu-hint { margin-top: 0.35rem; font-size: 0.85rem; color: var(--text); }
    .quota-hint { margin-top: 0.5rem; font-size: 0.85rem; color: var(--primary); font-weight: 500; }
    .cta-btns { display: flex; gap: 0.75rem; flex-shrink: 0; }
    .profile-content { padding: 2rem 0 4rem; }
    .detail-ad { margin-bottom: 1.5rem; }
    .detail-ad-bottom { margin-top: 1.5rem; margin-bottom: 0; }
    .status-card { padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; }
    .status-card h3 { font-size: 1rem; margin-bottom: 0.5rem; color: var(--primary); }
    .status-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; }
    .urdu-hint { margin-top: 0.5rem; color: var(--text); }
    .process-hint { margin-top: 0.5rem; font-size: 0.82rem; }
    .info-card { border-left: 4px solid #3b82f6; background: #f0f7ff; }
    .reject-card { border-left: 4px solid #ef4444; background: #fef2f2; }
    .warn-card { border-left: 4px solid #f59e0b; background: #fffbeb; }
    .contact-card { border-left: 4px solid var(--primary); background: #f0fdf4; }
    .admin-view-card { border-left: 4px solid #7c3aed; background: #f5f3ff; }
    .admin-meta { font-size: 0.9rem; margin-bottom: 0.75rem; color: var(--text); }
    .admin-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
    .admin-back-btn { margin-top: 0; }
    .request-limit-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.6rem;
      margin-top: 0.85rem;
    }
    .request-limit-row label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text);
    }
    .request-limit-row .form-select { max-width: 140px; }
    .expiry-note { font-size: 0.82rem; color: #b45309; margin-bottom: 0.75rem; }
    .contact-shared-note { font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.75rem; line-height: 1.5; }
    .contact-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .contact-item { display: flex; align-items: center; gap: 1rem; }
    .contact-type { font-size: 0.82rem; color: var(--text-muted); min-width: 80px; }
    .contact-number { font-size: 1.1rem; font-weight: 700; color: var(--primary); text-decoration: none; }
    .content-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 1.5rem; }
    .detail-card { padding: 1.5rem; }
    .detail-card h3 {
      font-size: 1rem; font-weight: 700; margin-bottom: 1rem;
      padding-bottom: 0.75rem; border-bottom: 2px solid var(--border);
      color: var(--primary);
    }
    .detail-card p { color: var(--text-muted); line-height: 1.8; }
    .family-view { display: flex; flex-direction: column; gap: 0.85rem; }
    .family-parent-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.85rem;
    }
    .family-parent-card {
      background: linear-gradient(180deg, #FFF8F3 0%, #fff 100%);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 12px;
      padding: 0.9rem 1rem;
    }
    .family-parent-card span {
      display: block;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 0.2rem;
    }
    .family-parent-card strong { font-size: 1rem; color: var(--text); }
    .family-parent-card p {
      margin: 0.25rem 0 0;
      font-size: 0.88rem;
      color: var(--text-muted);
    }
    .family-chip {
      display: inline-flex;
      align-self: flex-start;
      background: rgba(155, 27, 48, 0.08);
      color: var(--primary);
      font-size: 0.82rem;
      font-weight: 700;
      border-radius: 999px;
      padding: 0.3rem 0.75rem;
    }
    .family-sib-list { margin-top: 0.15rem; }
    .family-legacy { white-space: pre-line; }
    .req-notes { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .info-list { display: flex; flex-direction: column; gap: 0.85rem; }
    .info-item {
      display: grid;
      grid-template-columns: minmax(6.5rem, 38%) 1fr;
      gap: 0.35rem 1rem;
      align-items: start;
      font-size: 0.9rem;
    }
    .info-item span {
      color: var(--text-muted);
      line-height: 1.5;
      padding-top: 0.1rem;
    }
    .info-item strong {
      color: var(--text);
      font-weight: 600;
      line-height: 1.55;
      text-align: right;
      word-break: break-word;
    }
    .login-prompt { text-align: center; }
    .login-prompt p { margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-muted); }
    .alert-info { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem;
    }
    .modal { max-width: 480px; width: 100%; padding: 1.5rem; }
    .complain-modal { border-top: 4px solid #f59e0b; }
    .modal-head { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.25rem; }
    .modal-icon-wrap {
      display: flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      flex-shrink: 0;
    }
    .modal-icon-wrap svg { width: 22px; height: 22px; color: #b45309; }
    .modal h3 { margin-bottom: 0.25rem; font-size: 1.15rem; color: var(--primary); }
    .modal-sub { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0; }
    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 1rem; }
    @media (max-width: 768px) {
      .content-grid { grid-template-columns: 1fr; }
      .profile-header { flex-direction: column; text-align: center; }
      .profile-actions { margin-left: 0; align-items: center; }
      .complain-text { align-items: center; text-align: center; }
      .cta-card { flex-direction: column; text-align: center; }
      .cta-btns { justify-content: center; }
      .info-item {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
      .info-item strong { text-align: left; }
      .family-parent-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ProfileDetailComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly adminService = inject(AdminService);
  readonly favorites = inject(FavoritesService);
  readonly adSlots = ADSENSE_SLOTS;
  readonly formatHeightCm = formatHeightCm;
  readonly formatProfileLocation = formatProfileLocation;
  readonly isOverseasProvince = isOverseasProvince;
  readonly aliveLabel = aliveLabel;
  readonly requestSlotOptions = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30];

  ratingStars(n?: number | null): string {
    const count = Number(n);
    if (!count || count < 1) return '';
    return '★'.repeat(Math.min(5, count));
  }

  profile = signal<Profile | null>(null);
  accessStatus = signal<ContactAccessStatus | null>(null);
  loading = signal(true);
  requesting = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error' | 'info'>('success');
  showComplaintModal = signal(false);
  complaintCategory = 'fake_profile';
  complaintDescription = '';
  complaintSubmitting = signal(false);
  complaintMessage = signal('');
  complaintMessageType = signal<'success' | 'error'>('error');
  cancelling = signal(false);
  savingRequestLimit = signal(false);
  requestLimitDraft = 3;
  readonly complaintErrors = new FormErrorState();

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/search']); return; }

    if (!this.canViewThisProfile) {
      this.loading.set(false);
      return;
    }

    this.profileService.getById(id).subscribe({
      next: (res) => {
        this.profile.set(res.data);
        this.requestLimitDraft = res.data.contact_request_limit || 3;
        this.loading.set(false);
        if (this.auth.isLoggedIn() && !this.auth.isAdmin()) {
          this.loadAccessStatus(id);
        }
      },
      error: () => { this.loading.set(false); this.router.navigate(['/search']); },
    });
  }

  get canViewThisProfile(): boolean {
    if (this.auth.isAdmin()) return true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.auth.currentUser()?.profile_id === id) return true;
    return this.auth.isLoggedIn() && !!this.auth.currentUser()?.is_profile_complete;
  }

  loadAccessStatus(profileId: string): void {
    this.accessStatus.set({ status: 'none' });
    this.profileService.getContactAccessStatus(profileId).subscribe({
      next: (res) => this.accessStatus.set(res.data),
      error: () => this.accessStatus.set({ status: 'none' }),
    });
  }

  contactStatus(): ContactAccessStatus['status'] {
    return this.accessStatus()?.status ?? 'none';
  }

  canRequestContact(): boolean {
    const s = this.contactStatus();
    const canByStatus = s === 'none' || s === 'expired';
    if (!canByStatus) return false;
    const status = this.accessStatus();
    if (status?.can_request === false || status?.can_request_today === false) return false;
    if (status?.pending_remaining === 0 || status?.daily_remaining === 0) return false;
    if (status?.can_request_again === false) return false;
    return true;
  }

  isPendingLimitReached(): boolean {
    const s = this.contactStatus();
    if (s !== 'none' && s !== 'expired') return false;
    const status = this.accessStatus();
    return status?.can_request === false
      || status?.can_request_today === false
      || status?.pending_remaining === 0
      || status?.daily_remaining === 0;
  }

  pendingRemaining(): number | null {
    const status = this.accessStatus();
    const remaining = status?.pending_remaining ?? status?.daily_remaining;
    return remaining === undefined ? null : remaining;
  }

  pendingLimit(): number {
    return this.accessStatus()?.pending_limit ?? this.accessStatus()?.daily_limit ?? 3;
  }

  toggleFavorite(): void {
    const p = this.profile();
    if (!p) return;
    this.favorites.toggle(p.id, p);
  }

  saveRequestLimit(): void {
    const p = this.profile();
    if (!p) return;
    this.savingRequestLimit.set(true);
    this.adminService.setRequestLimit(p.id, this.requestLimitDraft).subscribe({
      next: (res) => {
        this.savingRequestLimit.set(false);
        this.profile.update((x) => x
          ? { ...x, contact_request_limit: res.data?.contact_request_limit ?? (this.requestLimitDraft === 3 ? null : this.requestLimitDraft) }
          : x);
        this.message.set(res.message || 'Request slots updated');
        this.messageType.set('success');
      },
      error: (err) => {
        this.savingRequestLimit.set(false);
        this.message.set(err.error?.message || 'Could not update request slots');
        this.messageType.set('error');
      },
    });
  }

  requestContact(): void {
    const p = this.profile();
    if (!p) return;

    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.requesting.set(true);
    this.profileService.requestContact(p.id).subscribe({
      next: (res) => {
        this.requesting.set(false);
        this.loadAccessStatus(p.id);
        this.message.set(res.message || 'Request sent to the user and admin.');
        this.messageType.set('success');
      },
      error: (err) => {
        this.requesting.set(false);
        const status = err.status as number | undefined;
        const apiMessage = err.error?.message || 'Failed to submit request';
        if (status === 401) {
          this.message.set('Please login again to request a contact number.');
        } else {
          this.message.set(apiMessage);
        }
        this.messageType.set('error');
      },
    });
  }

  cancelConnection(): void {
    const status = this.accessStatus();
    if (!status?.request_id) return;

    this.cancelling.set(true);
    this.profileService.cancelContactRequest(status.request_id).subscribe({
      next: (res) => {
        this.cancelling.set(false);
        const p = this.profile();
        if (p) this.loadAccessStatus(p.id);
        this.message.set(res.message || 'Connection cancelled');
        this.messageType.set('info');
      },
      error: (err) => {
        this.cancelling.set(false);
        this.message.set(err.error?.message || 'Failed to cancel connection');
        this.messageType.set('error');
      },
    });
  }

  openComplaintModal(): void {
    this.complaintMessage.set('');
    this.complaintErrors.reset();
    this.showComplaintModal.set(true);
  }

  submitComplaint(): void {
    const p = this.profile();
    if (!p) return;

    this.complaintErrors.markSubmitted();
    const errors = validateComplaint(this.complaintDescription, this.complaintCategory);
    this.complaintErrors.setAll(errors);
    if (Object.keys(errors).length) {
      this.complaintMessage.set(firstError(errors) ?? 'Please fix the errors');
      this.complaintMessageType.set('error');
      this.message.set(firstError(errors) ?? 'Please fix the errors');
      this.messageType.set('error');
      return;
    }

    this.complaintSubmitting.set(true);
    this.complaintMessage.set('');
    this.profileService.submitComplaint(p.id, this.complaintCategory, this.complaintDescription).subscribe({
      next: (res) => {
        this.complaintSubmitting.set(false);
        const ok = res.message || 'Report submitted successfully. Admin will review it.';
        this.complaintMessage.set(ok);
        this.complaintMessageType.set('success');
        this.message.set(ok);
        this.messageType.set('success');
        this.complaintDescription = '';
        this.complaintErrors.reset();
        setTimeout(() => this.showComplaintModal.set(false), 1200);
      },
      error: (err) => {
        this.complaintSubmitting.set(false);
        const status = err.status as number | undefined;
        const apiMessage = status === 401
          ? 'Please login again to submit a report.'
          : (err.error?.message || 'Failed to submit report');
        this.complaintMessage.set(apiMessage);
        this.complaintMessageType.set('error');
        this.message.set(apiMessage);
        this.messageType.set('error');
      },
    });
  }

  contactLink(c: { type: string; number: string }): string {
    if (c.type === 'whatsapp') {
      const num = c.number.replace(/\D/g, '');
      return `https://wa.me/${num}`;
    }
    return `tel:${c.number}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  formatStatus(status?: string): string {
    if (!status) return '---';
    if (status === 'never_married') return 'Single';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  formatMultiPref(value?: string | null): string {
    if (!value?.trim()) return '---';
    return value.split(',').map((s) => s.trim()).filter(Boolean).join(', ');
  }

  hasPartnerRequirements(prefs?: PartnerPreferences): boolean {
    if (!prefs) return false;
    return !!(
      prefs.min_age || prefs.max_age ||
      prefs.min_height_cm || prefs.max_height_cm ||
      prefs.religion || prefs.sect || prefs.caste ||
      prefs.province || prefs.city || prefs.country ||
      prefs.education || prefs.profession ||
      prefs.marital_status || prefs.requirements_notes?.trim()
    );
  }

  familyView(): string {
    return familyDetailsDisplay(this.profile()?.family_details);
  }

  structuredFamily(): FamilyDetails | null {
    const raw = this.profile()?.family_details;
    if (!isStructuredFamilyDetails(raw) || !this.familyView()) return null;
    return parseFamilyDetails(raw);
  }

  brotherCounts(): { total: number; married: number; unmarried: number } {
    return familyCounts(this.structuredFamily()?.brothers || []);
  }

  sisterCounts(): { total: number; married: number; unmarried: number } {
    return familyCounts(this.structuredFamily()?.sisters || []);
  }

  siblingLine(row: FamilySibling): string {
    return [siblingOrderLabel(row.order), marriedLabel(row.married), row.profession.trim()]
      .filter(Boolean)
      .join(' · ') || 'Details not added';
  }
}
