import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Profile, ProfileContact, PartnerPreferences } from '../../core/models';
import {
  emptyFamilyDetails,
  emptySibling,
  familyCounts,
  familyProfessionOptions,
  isFamilyDetailsComplete,
  isFamilyDetailsEmpty,
  parseFamilyDetails,
  serializeFamilyDetails,
  type FamilyDetails,
} from '../../core/utils/family-details';
import { sectsForReligion, RELIGION_OPTIONS, ALL_SECT_OPTIONS } from '../../core/constants/religion-sects';
import { PAKISTAN_LANGUAGES, INTERNATIONAL_LANGUAGES } from '../../core/constants/languages';
import { educationOptionsWithValue } from '../../core/constants/education';
import { casteOptionsWithValue } from '../../core/constants/caste';
import {
  PROFESSION_CATEGORIES,
  PROFESSION_OTHER,
  formatProfession,
  parseStoredProfession,
  professionOptionsWithValue,
  professionsForCategory,
} from '../../core/constants/profession';
import {
  HEIGHT_FEET_OPTIONS,
  HEIGHT_INCHES_OPTIONS,
  feetInchesToCm,
  formatFeetInches,
  parseFeetInchesFromCm,
} from '../../core/utils/height';
import {
  ALL_LOCATION_PROVINCES,
  PAKISTAN_PROVINCES,
  OVERSEAS_COUNTRIES,
  citiesForProvince,
  isOverseasProvince,
  provinceLabel,
} from '../../core/constants/pakistan-locations';
import { EDUCATION_OPTIONS } from '../../core/constants/education';
import { ProfileService } from '../../core/services/profile.service';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { DropdownService } from '../../core/services/dropdown.service';
import { ProfileAvatarComponent } from '../../shared/components/profile-avatar/profile-avatar';
import { FormErrorState } from '../../core/utils/form-error-state';
import { firstError, validateMyProfileForm, validateOptionalProfileForm, validateAdminCreateProfileForm } from '../../core/utils/validation';
import { FieldErrorComponent } from '../../shared/components/field-error/field-error';
import { OptionRequestComponent } from '../../shared/components/option-request/option-request';

function joinFullName(first?: string | null, last?: string | null): string {
  const parts = [first, last]
    .map((p) => (p || '').trim())
    .filter((p) => p && p !== '---' && p !== '—');
  return parts.join(' ');
}

function splitFullName(full: string): { first_name: string; last_name: string } {
  const cleaned = (full || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return { first_name: '', last_name: '' };
  const space = cleaned.indexOf(' ');
  if (space === -1) return { first_name: cleaned, last_name: '—' };
  return {
    first_name: cleaned.slice(0, space),
    last_name: cleaned.slice(space + 1).trim() || '—',
  };
}

function parseLanguages(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseMultiSelect(raw?: string | null): string[] {
  return parseLanguages(raw);
}

function joinMultiSelect(values: string[]): string | undefined {
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(', ') : undefined;
}
@Component({
  selector: 'app-my-profile',
  imports: [FormsModule, ProfileAvatarComponent, FieldErrorComponent, OptionRequestComponent, RouterLink],
  template: `
    <div class="bg-page-header">
      <div class="container">
        <h1 class="animate-fade-in-up">{{ pageTitle }}</h1>
        <p class="text-urdu animate-fade-in-up delay-1">{{ pageSubtitle }}</p>
      </div>
    </div>

    <div class="container page-section profile-page">
      @if (adminEditId() || adminCreateMode()) {
        <div class="admin-edit-bar animate-fade-in-up">
          @if (adminEditId()) {
            <a [routerLink]="['/profile', adminEditId()]" class="btn btn-outline btn-sm">Preview Profile</a>
            <a routerLink="/admin/profiles" class="btn btn-outline btn-sm">← Back to Manage Profiles</a>
          } @else {
            <a routerLink="/admin/profiles" class="btn btn-outline btn-sm">← Back to Manage Profiles</a>
          }
        </div>
      }
      @if (message()) {
        <div class="alert alert-float" [class.alert-success]="messageType() === 'success'" [class.alert-error]="messageType() === 'error'">
          {{ message() }}
        </div>
      }

      @if (loading()) {
        <div class="loading-center"><div class="spinner"></div></div>
      } @else {
        <div class="profile-top card animate-fade-in-up">
          <div class="photo-block">
            <app-profile-avatar
              [photo]="profile.profile_photo"
              [gender]="profile.gender"
              [firstName]="profile.first_name"
              [lastName]="profile.last_name"
              size="lg"
            />
            <div class="photo-actions">
              <label class="btn btn-outline btn-sm photo-upload-btn">
                {{ uploadingPhoto() ? 'Uploading...' : 'Add Photo' }}
                <input type="file" accept="image/*" hidden (change)="onPhotoSelected($event)" [disabled]="uploadingPhoto()" />
              </label>
              @if (profile.profile_photo) {
                <button type="button" class="btn-link-muted" (click)="removePhoto()">Remove</button>
              }
              <p class="photo-hint">Optional — default avatar if empty</p>
            </div>
          </div>
          <div class="profile-top-info">
            <h2>{{ displayName || 'Your Profile' }}</h2>
            <p class="profile-top-meta">
              @if (profile.city && profile.province) {
                {{ profile.city }}, {{ profile.province }}
              } @else {
                Complete your profile to get better matches
              }
            </p>
            <div class="completion-wrap">
              <div class="completion-label">
                <span>Profile Completion</span>
                <strong>{{ completionPercent }}%</strong>
              </div>
              <div class="completion-bar">
                <div class="completion-fill" [style.width.%]="completionPercent"></div>
              </div>
            </div>
          </div>
        </div>

        <form class="profile-form animate-fade-in-up delay-1" (ngSubmit)="save()" novalidate>
          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">👤</span>
              <div>
                <h3>Basic Information{{ !isAdminForm ? ' *' : '' }}</h3>
                <p>Your personal details</p>
              </div>
            </div>
            <div class="section-body">
              <div class="form-group">
                <label class="form-label">Full Name{{ !isAdminForm ? ' *' : '' }}</label>
                <input class="form-input" [class.input-invalid]="formErrors.show('full_name')" [(ngModel)]="fullName" name="full_name" placeholder="Enter full name" (blur)="formErrors.touch('full_name')" (ngModelChange)="formErrors.clear('full_name')" />
                <app-field-error [message]="formErrors.message('full_name')" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Guardian{{ !isAdminForm ? ' *' : '' }}</label>
                  <select class="form-select" [class.input-invalid]="formErrors.show('guardian_type')" [(ngModel)]="profile.guardian_type" name="guardian_type" (ngModelChange)="onGuardianTypeChange($event); formErrors.clear('guardian_type')">
                    @if (isAdminForm) { <option value="">---</option> }
                    @if (!isAdminForm) { <option value="">Select</option> }
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                  <app-field-error [message]="formErrors.message('guardian_type')" />
                </div>
                @if (profile.guardian_type) {
                  <div class="form-group">
                    <label class="form-label">{{ profile.guardian_type }} Name{{ !isAdminForm ? ' *' : '' }}</label>
                    <input class="form-input" [class.input-invalid]="formErrors.show('guardian_name')" [(ngModel)]="profile.guardian_name" name="guardian_name" [placeholder]="profile.guardian_type + ' name'" (ngModelChange)="formErrors.clear('guardian_name')" />
                    <app-field-error [message]="formErrors.message('guardian_name')" />
                  </div>
                }
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">{{ adminCreateMode() ? 'Gender (Man / Woman)' : 'Gender' }}{{ !isAdminForm ? ' *' : '' }}</label>
                  @if (adminCreateMode()) {
                    <div class="gender-pick" [class.input-invalid-wrap]="formErrors.show('gender')">
                      <label class="gender-option" [class.active]="profile.gender === 'male'">
                        <input type="radio" name="gender" value="male" [(ngModel)]="profile.gender" (ngModelChange)="formErrors.clear('gender')" />
                        <span>👨 Man</span>
                      </label>
                      <label class="gender-option" [class.active]="profile.gender === 'female'">
                        <input type="radio" name="gender" value="female" [(ngModel)]="profile.gender" (ngModelChange)="formErrors.clear('gender')" />
                        <span>👩 Woman</span>
                      </label>
                    </div>
                    <app-field-error [message]="formErrors.message('gender')" />
                  } @else {
                    <select class="form-select" [class.input-invalid]="formErrors.show('gender')" [(ngModel)]="profile.gender" name="gender" (ngModelChange)="formErrors.clear('gender')">
                      @if (isAdminForm) { <option value="">---</option> }
                      <option value="male">Man</option>
                      <option value="female">Woman</option>
                    </select>
                    <app-field-error [message]="formErrors.message('gender')" />
                  }
                </div>
                <div class="form-group">
                  <label class="form-label">Date of Birth{{ !isAdminForm ? ' *' : '' }}</label>
                  <input class="form-input" [class.input-invalid]="formErrors.show('date_of_birth')" type="date" [(ngModel)]="profile.date_of_birth" name="dob" (blur)="formErrors.touch('date_of_birth')" (ngModelChange)="formErrors.clear('date_of_birth')" />
                  <app-field-error [message]="formErrors.message('date_of_birth')" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Height{{ !isAdminForm ? ' *' : '' }}</label>
                  <div class="height-row" [class.input-invalid-wrap]="formErrors.show('height')">
                    <select class="form-select" [(ngModel)]="heightFeet" name="height_ft" (ngModelChange)="onHeightFeetChange($event); formErrors.clear('height')">
                      <option [ngValue]="null">Feet</option>
                      @for (f of feetOptions; track f) {
                        <option [ngValue]="f">{{ f }}′</option>
                      }
                    </select>
                    <select class="form-select" [(ngModel)]="heightInches" name="height_in" (ngModelChange)="syncProfileHeight()">
                      <option [ngValue]="null">In</option>
                      @for (i of inchesOptions; track i) {
                        <option [ngValue]="i">{{ i }}″</option>
                      }
                    </select>
                    @if (heightFeet !== null && heightInches !== null) {
                      <span class="height-preview">{{ heightPreview }}</span>
                    }
                  </div>
                  <app-field-error [message]="formErrors.message('height')" />
                </div>
                <div class="form-group">
                  <label class="form-label">Weight (kg){{ !isAdminForm ? ' *' : '' }}</label>
                  <input class="form-input" [class.input-invalid]="formErrors.show('weight')" type="number" min="20" max="300" step="0.1" [(ngModel)]="profile.weight_kg" name="weight" placeholder="e.g. 70" (ngModelChange)="formErrors.clear('weight')" />
                  <app-field-error [message]="formErrors.message('weight')" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Marital Status{{ !isAdminForm ? ' *' : '' }}</label>
                  <select class="form-select" [class.input-invalid]="formErrors.show('marital_status')" [(ngModel)]="profile.marital_status" name="marital" (ngModelChange)="formErrors.clear('marital_status')">
                    @if (isAdminForm) { <option value="">---</option> }
                    <option value="never_married">Single</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                  </select>
                  <app-field-error [message]="formErrors.message('marital_status')" />
                </div>
                <div class="form-group">
                  <label class="form-label">Color{{ !isAdminForm ? ' *' : '' }}</label>
                  <select class="form-select" [class.input-invalid]="formErrors.show('color')" [(ngModel)]="profile.color" name="color" (ngModelChange)="formErrors.clear('color')">
                    @if (isAdminForm) { <option value="">---</option> }
                    @if (!isAdminForm) { <option value="">Select</option> }
                    @for (c of colorOptions; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                  <app-field-error [message]="formErrors.message('color')" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Disability{{ !isAdminForm ? ' *' : '' }}</label>
                  <select class="form-select" [class.input-invalid]="formErrors.show('disability')" [(ngModel)]="disabilityChoice" name="disability" (ngModelChange)="onDisabilityChoice($event); formErrors.clear('disability')">
                    @if (isAdminForm) { <option value="">---</option> }
                    @if (!isAdminForm) { <option value="">Select</option> }
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  <app-field-error [message]="formErrors.message('disability')" />
                </div>
              </div>
              @if (disabilityChoice === 'Yes') {
                <div class="form-group">
                  <label class="form-label">Disability details (optional)</label>
                  <input
                    class="form-input"
                    [(ngModel)]="disabilityDetails"
                    name="disability_details"
                    placeholder="e.g. mild hearing issue"
                    (ngModelChange)="syncDisabilityField()"
                  />
                </div>
              }
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">🕌</span>
              <div>
                <h3>Religious & Cultural{{ !isAdminForm ? ' *' : '' }}</h3>
                <p>Faith and family background</p>
              </div>
            </div>
            <div class="section-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Religion{{ !isAdminForm ? ' *' : '' }}</label>
                  <select
                    class="form-select"
                    [class.input-invalid]="formErrors.show('religion')"
                    [(ngModel)]="profile.religion"
                    name="religion"
                    (ngModelChange)="onReligionChange($event); formErrors.clear('religion')"
                  >
                    @if (isAdminForm) { <option value="">---</option> }
                    @if (!isAdminForm) { <option value="">Select</option> }
                    @for (r of religionOptions; track r) {
                      <option [value]="r">{{ r }}</option>
                    }
                  </select>
                  <app-field-error [message]="formErrors.message('religion')" />
                </div>
                <div class="form-group">
                  <label class="form-label">Sect / Denomination{{ !isAdminForm ? ' *' : '' }}</label>
                  <select
                    class="form-select"
                    [class.input-invalid]="formErrors.show('sect')"
                    [(ngModel)]="profile.sect"
                    name="sect"
                    (ngModelChange)="formErrors.clear('sect')"
                  >
                    @if (isAdminForm) { <option value="">---</option> }
                    @if (!isAdminForm) { <option value="">Select</option> }
                    @for (s of sectSuggestions; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                  <app-field-error [message]="formErrors.message('sect')" />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Caste{{ !isAdminForm ? ' *' : '' }}</label>
                <select class="form-select" [class.input-invalid]="formErrors.show('caste')" [(ngModel)]="profile.caste" name="caste" (ngModelChange)="formErrors.clear('caste')">
                  @if (isAdminForm) { <option value="">---</option> }
                  @if (!isAdminForm) { <option value="">Select</option> }
                  @for (c of casteOptions; track c) {
                    <option [value]="c">{{ c }}</option>
                  }
                </select>
                <app-field-error [message]="formErrors.message('caste')" />
                @if (!isAdminForm) {
                  <app-option-request fieldKey="caste" fieldLabel="Caste" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">🗣️</span>
              <div>
                <h3>Languages{{ !isAdminForm ? ' *' : '' }}</h3>
                <p>Select all languages you speak</p>
              </div>
            </div>
            <div class="section-body">
              <div class="lang-section" [class.input-invalid-wrap]="formErrors.show('languages')">
                <p class="lang-pick-hint">Select a category first — you can choose both</p>
                <div class="lang-category-row">
                  <label class="lang-category" [class.active]="showPakistanLanguages">
                    <input type="checkbox" [(ngModel)]="showPakistanLanguages" name="lang_cat_pk" (ngModelChange)="onLanguageCategoryChange()" />
                    <span>Pakistan languages</span>
                  </label>
                  <label class="lang-category" [class.active]="showInternationalLanguages">
                    <input type="checkbox" [(ngModel)]="showInternationalLanguages" name="lang_cat_intl" (ngModelChange)="onLanguageCategoryChange()" />
                    <span>International languages</span>
                  </label>
                </div>

                @if (showPakistanLanguages) {
                  <h4 class="lang-group-title">Pakistan languages</h4>
                  <div class="lang-grid">
                    @for (lang of pakistanLanguages; track lang) {
                      <label class="lang-chip" [class.active]="isLanguageSelected(lang)">
                        <input type="checkbox" [checked]="isLanguageSelected(lang)" (change)="toggleLanguage(lang, $event)" />
                        <span>{{ lang }}</span>
                      </label>
                    }
                  </div>
                }

                @if (showInternationalLanguages) {
                  <h4 class="lang-group-title">International languages</h4>
                  <div class="lang-grid">
                    @for (lang of internationalLanguages; track lang) {
                      <label class="lang-chip" [class.active]="isLanguageSelected(lang)">
                        <input type="checkbox" [checked]="isLanguageSelected(lang)" (change)="toggleLanguage(lang, $event)" />
                        <span>{{ lang }}</span>
                      </label>
                    }
                  </div>
                }

                @if (selectedLanguages.length) {
                  <p class="lang-selected-summary">Selected: {{ selectedLanguages.join(', ') }}</p>
                }
                @if (!isAdminForm) {
                  <app-option-request fieldKey="language" fieldLabel="Language" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>
              <app-field-error [message]="formErrors.message('languages')" />
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">📞</span>
              <div>
                <h3>Contact{{ !isAdminForm ? ' *' : '' }}</h3>
                <p>Email{{ adminCreateMode() || !isAdminForm ? ' *' : '' }} · Phone required · WhatsApp optional</p>
              </div>
            </div>
            <div class="section-body">
              <div class="form-group">
                <label class="form-label">Email{{ adminCreateMode() || !isAdminForm ? ' *' : '' }}</label>
                <input
                  type="email"
                  class="form-input"
                  [class.input-invalid]="formErrors.show('email')"
                  [(ngModel)]="accountEmail"
                  name="accountEmail"
                  placeholder="you@example.com"
                  autocomplete="email"
                  (ngModelChange)="formErrors.clear('email')"
                />
                <app-field-error [message]="formErrors.message('email')" />
              </div>
              <app-field-error [message]="formErrors.message('contacts')" />
              @for (contact of contacts; track $index; let i = $index) {
                <div class="contact-row">
                  <div class="form-group contact-type">
                    <label class="form-label">Type</label>
                    <select class="form-select" [(ngModel)]="contact.type" [name]="'ctype_' + i">
                      <option value="phone">Phone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                  <div class="form-group contact-number">
                    <label class="form-label">
                      {{ contact.type === 'whatsapp' ? 'WhatsApp Number' : 'Phone Number' }}{{ !isAdminForm && contact.type === 'phone' ? ' *' : '' }}
                    </label>
                    <input
                      class="form-input"
                      [class.input-invalid]="formErrors.show('contacts')"
                      [(ngModel)]="contact.number"
                      [name]="'cnum_' + i"
                      placeholder="+92 300 1234567 or +1 416 555 0100"
                      (ngModelChange)="formErrors.clear('contacts')"
                    />
                  </div>
                  @if (contacts.length > 1) {
                    <button type="button" class="btn-remove" (click)="removeContact(i)" aria-label="Remove number">✕</button>
                  }
                </div>
              }
              <button type="button" class="btn-add-contact" (click)="addContact()">+ Add Number</button>
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">📍</span>
              <div>
                <h3>Location</h3>
                <p>Where you live</p>
              </div>
            </div>
            <div class="section-body">
              <div class="residence-section" [class.input-invalid-wrap]="formErrors.show('residence')">
                <p class="lang-pick-hint">Select residence — at least one required (Pakistan selected by default)</p>
                <div class="lang-category-row">
                  <label class="lang-category" [class.active]="showPakistanResidence">
                    <input type="checkbox" [(ngModel)]="showPakistanResidence" name="res_pk" (ngModelChange)="onResidenceCategoryChange()" />
                    <span>Pakistan</span>
                  </label>
                  <label class="lang-category" [class.active]="showAbroadResidence">
                    <input type="checkbox" [(ngModel)]="showAbroadResidence" name="res_abroad" (ngModelChange)="onResidenceCategoryChange()" />
                    <span>Abroad</span>
                  </label>
                </div>
                <app-field-error [message]="formErrors.message('residence')" />
              </div>

              @if (showPakistanResidence) {
                <div class="residence-block">
                  <h4 class="lang-group-title">Pakistan Residence</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">State / Province</label>
                      <select
                        class="form-select"
                        [class.input-invalid]="formErrors.show('province')"
                        [(ngModel)]="profile.province"
                        name="province"
                        (ngModelChange)="onProvinceChange($event); formErrors.clear('province')"
                      >
                        @if (isAdminForm) { <option value="">---</option> }
                        @if (!isAdminForm) { <option value="">Select</option> }
                        @for (p of pakistanProvinces; track p) {
                          <option [value]="p">{{ provinceLabel(p) }}</option>
                        }
                      </select>
                      <app-field-error [message]="formErrors.message('province')" />
                      @if (!isAdminForm) {
                        <app-option-request fieldKey="state" fieldLabel="State / Province" [userName]="displayName" [userEmail]="accountEmail" />
                      }
                    </div>
                    <div class="form-group">
                      <label class="form-label">City{{ !isAdminForm ? ' *' : '' }}</label>
                      <select
                        class="form-select"
                        [class.input-invalid]="formErrors.show('city')"
                        [(ngModel)]="profile.city"
                        name="city"
                        (ngModelChange)="formErrors.clear('city')"
                      >
                        @if (isAdminForm) { <option value="">---</option> }
                        @if (!isAdminForm) { <option value="">Select</option> }
                        @for (city of availableCities; track city) {
                          <option [value]="city">{{ city }}</option>
                        }
                      </select>
                      <app-field-error [message]="formErrors.message('city')" />
                      @if (!isAdminForm) {
                        <app-option-request fieldKey="city" fieldLabel="City" [userName]="displayName" [userEmail]="accountEmail" />
                      }
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">House Type{{ !isAdminForm ? ' *' : '' }}</label>
                      <select class="form-select" [class.input-invalid]="formErrors.show('pk_house_type')" [(ngModel)]="pkHouseType" name="pk_house_type" (ngModelChange)="onPkHouseTypeChange($event); formErrors.clear('pk_house_type')">
                        @if (isAdminForm) { <option value="">---</option> }
                        @if (!isAdminForm) { <option value="">Select</option> }
                        <option value="own">Own</option>
                        <option value="rent">Rent</option>
                      </select>
                      <app-field-error [message]="formErrors.message('pk_house_type')" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Complete Address{{ !isAdminForm ? ' *' : '' }}</label>
                      <input
                        class="form-input"
                        [class.input-invalid]="formErrors.show('pk_house_location')"
                        [(ngModel)]="pkHouseLocation"
                        name="pk_house_location"
                        [placeholder]="pkHouseType ? 'Enter full address' : 'Select house type first'"
                        [disabled]="!pkHouseType"
                        (ngModelChange)="syncPkHouseFields(); formErrors.clear('pk_house_location')"
                      />
                      <app-field-error [message]="formErrors.message('pk_house_location')" />
                    </div>
                  </div>
                </div>
              }

              @if (showAbroadResidence) {
                <div class="residence-block">
                  <h4 class="lang-group-title">Abroad Residence</h4>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Country</label>
                      <select
                        class="form-select"
                        [class.input-invalid]="formErrors.show('abroad_country')"
                        [(ngModel)]="profile.abroad_country"
                        name="abroad_country"
                        (ngModelChange)="formErrors.clear('abroad_country')"
                      >
                        @if (isAdminForm) { <option value="">---</option> }
                        @if (!isAdminForm) { <option value="">Select</option> }
                        @for (c of overseasCountries; track c) {
                          <option [value]="c">{{ c }}</option>
                        }
                      </select>
                      <app-field-error [message]="formErrors.message('abroad_country')" />
                      @if (!isAdminForm) {
                        <app-option-request fieldKey="country" fieldLabel="Country" [userName]="displayName" [userEmail]="accountEmail" />
                      }
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">House Type{{ !isAdminForm ? ' *' : '' }}</label>
                      <select class="form-select" [class.input-invalid]="formErrors.show('abroad_house_type')" [(ngModel)]="abroadHouseType" name="abroad_house_type" (ngModelChange)="onAbroadHouseTypeChange($event); formErrors.clear('abroad_house_type')">
                        @if (isAdminForm) { <option value="">---</option> }
                        @if (!isAdminForm) { <option value="">Select</option> }
                        <option value="own">Own</option>
                        <option value="rent">Rent</option>
                      </select>
                      <app-field-error [message]="formErrors.message('abroad_house_type')" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Complete Address{{ !isAdminForm ? ' *' : '' }}</label>
                      <input
                        class="form-input"
                        [class.input-invalid]="formErrors.show('abroad_house_location')"
                        [(ngModel)]="abroadHouseLocation"
                        name="abroad_house_location"
                        [placeholder]="abroadHouseType ? 'Enter full address' : 'Select house type first'"
                        [disabled]="!abroadHouseType"
                        (ngModelChange)="syncAbroadHouseFields(); formErrors.clear('abroad_house_location')"
                      />
                      <app-field-error [message]="formErrors.message('abroad_house_location')" />
                    </div>
                  </div>
                </div>
              }
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">🎓</span>
              <div>
                <h3>Education & Career</h3>
                <p>Qualifications and profession</p>
              </div>
            </div>
            <div class="section-body">
              <div class="form-group">
                <label class="form-label">Education{{ !isAdminForm ? ' *' : '' }}</label>
                <select
                  class="form-select"
                  [class.input-invalid]="formErrors.show('education')"
                  [(ngModel)]="profile.education"
                  name="education"
                  (ngModelChange)="formErrors.clear('education')"
                >
                  @if (isAdminForm) { <option value="">---</option> }
                  @if (!isAdminForm) { <option value="">Select</option> }
                  @for (e of educationOptions; track e) {
                    <option [value]="e">{{ e }}</option>
                  }
                </select>
                <app-field-error [message]="formErrors.message('education')" />
                @if (!isAdminForm) {
                  <app-option-request fieldKey="education" fieldLabel="Education" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>

              <div class="profession-section" [class.input-invalid-wrap]="formErrors.show('hafiz_quran') || formErrors.show('profession')">
                <label class="form-label">Hafiz-e-Quran{{ !isAdminForm ? ' *' : '' }}</label>
                <div class="profession-category-row">
                  <label class="profession-category" [class.active]="profile.hafiz_quran === 'Yes'">
                    <input type="radio" name="hafiz_quran" value="Yes" [(ngModel)]="profile.hafiz_quran" (ngModelChange)="formErrors.clear('hafiz_quran')" />
                    <span>Yes</span>
                  </label>
                  <label class="profession-category" [class.active]="profile.hafiz_quran === 'No'">
                    <input type="radio" name="hafiz_quran" value="No" [(ngModel)]="profile.hafiz_quran" (ngModelChange)="formErrors.clear('hafiz_quran')" />
                    <span>No</span>
                  </label>
                </div>
                <app-field-error [message]="formErrors.message('hafiz_quran')" />

                <label class="form-label">Profession{{ !isAdminForm ? ' *' : '' }}</label>
                <div class="profession-category-row">
                  @for (cat of professionCategories; track cat) {
                    <label class="profession-category" [class.active]="professionCategory === cat">
                      <input
                        type="radio"
                        name="profession_category"
                        [value]="cat"
                        [(ngModel)]="professionCategory"
                        (ngModelChange)="onProfessionCategoryChange($event)"
                      />
                      <span>{{ cat }}</span>
                    </label>
                  }
                </div>

                @if (professionCategory) {
                  <select
                    class="form-select"
                    [(ngModel)]="professionChoice"
                    name="profession_choice"
                    (ngModelChange)="onProfessionChoiceChange($event)"
                  >
                    @if (isAdminForm) { <option value="">---</option> }
                    @if (!isAdminForm) { <option value="">Select</option> }
                    @for (p of professionSelectOptions; track p) {
                      <option [value]="p">{{ p }}</option>
                    }
                  </select>

                  @if (professionChoice === professionOther && isAdminForm) {
                    <input
                      class="form-input"
                      [(ngModel)]="professionOtherText"
                      name="profession_other"
                      placeholder="Enter profession"
                      (ngModelChange)="formErrors.clear('profession')"
                    />
                  }
                }
              </div>
              <app-field-error [message]="formErrors.message('profession')" />
              @if (!isAdminForm) {
                <app-option-request fieldKey="profession" fieldLabel="Profession" [category]="professionCategory" [userName]="displayName" [userEmail]="accountEmail" />
              }
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">💑</span>
              <div>
                <h3>Partner Requirements</h3>
                <p>What you are looking for in a life partner</p>
              </div>
            </div>
            <div class="section-body">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Preferred Age (Min){{ !isAdminForm ? ' *' : '' }}</label>
                  <input class="form-input" type="number" [(ngModel)]="requirements.min_age" name="req_min_age" min="18" max="80" placeholder="Any" (ngModelChange)="formErrors.clear('req_age')" />
                </div>
                <div class="form-group">
                  <label class="form-label">Preferred Age (Max){{ !isAdminForm ? ' *' : '' }}</label>
                  <input class="form-input" type="number" [(ngModel)]="requirements.max_age" name="req_max_age" min="18" max="80" placeholder="Any" (ngModelChange)="formErrors.clear('req_age')" />
                </div>
              </div>
              <app-field-error [message]="formErrors.message('req_age')" />
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Min Height</label>
                  <div class="height-row">
                    <select class="form-select" [(ngModel)]="reqMinFeet" name="req_min_ft" (ngModelChange)="onReqMinFeetChange($event)">
                      <option [ngValue]="null">Any</option>
                      @for (f of feetOptions; track f) {
                        <option [ngValue]="f">{{ f }}′</option>
                      }
                    </select>
                    <select class="form-select" [(ngModel)]="reqMinInches" name="req_min_in" (ngModelChange)="syncReqMinHeight()" [disabled]="reqMinFeet === null">
                      <option [ngValue]="null">Any</option>
                      @for (i of inchesOptions; track i) {
                        <option [ngValue]="i">{{ i }}″</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Max Height</label>
                  <div class="height-row">
                    <select class="form-select" [(ngModel)]="reqMaxFeet" name="req_max_ft" (ngModelChange)="onReqMaxFeetChange($event)">
                      <option [ngValue]="null">Any</option>
                      @for (f of feetOptions; track f) {
                        <option [ngValue]="f">{{ f }}′</option>
                      }
                    </select>
                    <select class="form-select" [(ngModel)]="reqMaxInches" name="req_max_in" (ngModelChange)="syncReqMaxHeight()" [disabled]="reqMaxFeet === null">
                      <option [ngValue]="null">Any</option>
                      @for (i of inchesOptions; track i) {
                        <option [ngValue]="i">{{ i }}″</option>
                      }
                    </select>
                  </div>
                </div>
              </div>
              <app-field-error [message]="formErrors.message('req_height')" />
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Preferred Religion</label>
                  <select
                    class="form-select"
                    [(ngModel)]="requirements.religion"
                    name="req_religion"
                    (ngModelChange)="onReqReligionChange($event)"
                  >
                    <option value="">Any</option>
                    @for (r of religionOptions; track r) {
                      <option [value]="r">{{ r }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Preferred Sect</label>
                  <select class="form-select" [(ngModel)]="requirements.sect" name="req_sect">
                    <option value="">Any</option>
                    @for (s of reqSectSuggestions; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Preferred Caste</label>
                <div class="multi-pick-row">
                  <select class="form-select" [(ngModel)]="pendingReqCaste" name="pending_req_caste">
                    <option value="">Any</option>
                    @for (c of reqCasteDropdownOptions; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                  <button type="button" class="btn-add-pick" (click)="addReqCaste()" [disabled]="!pendingReqCaste">+ Add</button>
                </div>
                @if (selectedReqCastes.length) {
                  <div class="multi-pick-tags">
                    @for (c of selectedReqCastes; track c; let i = $index) {
                      <span class="multi-pick-tag">{{ c }}<button type="button" (click)="removeReqCaste(i)" aria-label="Remove">✕</button></span>
                    }
                  </div>
                }
                @if (!isAdminForm) {
                  <app-option-request fieldKey="caste" fieldLabel="Partner Caste" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>
              <div class="form-group">
                <label class="form-label">Preferred State</label>
                <div class="multi-pick-row">
                  <select class="form-select" [(ngModel)]="pendingReqState" name="pending_req_state">
                    <option value="">Any</option>
                    @for (prov of reqStateDropdownOptions; track prov) {
                      <option [value]="prov">{{ provinceLabel(prov) }}</option>
                    }
                  </select>
                  <button type="button" class="btn-add-pick" (click)="addReqState()" [disabled]="!pendingReqState">+ Add</button>
                </div>
                @if (selectedReqStates.length) {
                  <div class="multi-pick-tags">
                    @for (prov of selectedReqStates; track prov; let i = $index) {
                      <span class="multi-pick-tag">{{ provinceLabel(prov) }}<button type="button" (click)="removeReqState(i)" aria-label="Remove">✕</button></span>
                    }
                  </div>
                }
                @if (!isAdminForm) {
                  <app-option-request fieldKey="state" fieldLabel="Partner State" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>
              @if (showReqOverseasCountries) {
                <div class="form-group">
                  <label class="form-label">Preferred Country (Abroad)</label>
                  <div class="multi-pick-row">
                    <select class="form-select" [(ngModel)]="pendingReqCountry" name="pending_req_country">
                      <option value="">Any</option>
                      @for (c of overseasCountries; track c) {
                        <option [value]="c">{{ c }}</option>
                      }
                    </select>
                    <button type="button" class="btn-add-pick" (click)="addReqCountry()" [disabled]="!pendingReqCountry">+ Add</button>
                  </div>
                  @if (selectedReqCountries.length) {
                    <div class="multi-pick-tags">
                      @for (c of selectedReqCountries; track c; let i = $index) {
                        <span class="multi-pick-tag">{{ c }}<button type="button" (click)="removeReqCountry(i)" aria-label="Remove">✕</button></span>
                      }
                    </div>
                  }
                  @if (!isAdminForm) {
                    <app-option-request fieldKey="country" fieldLabel="Partner Country" [userName]="displayName" [userEmail]="accountEmail" />
                  }
                </div>
              }
              <div class="form-group">
                <label class="form-label">Preferred City</label>
                <div class="multi-pick-row">
                  <select class="form-select" [(ngModel)]="pendingReqCity" name="pending_req_city" [disabled]="!selectedReqStates.length">
                    <option value="">{{ selectedReqStates.length ? 'Any' : 'Select preferred state first' }}</option>
                    @for (city of reqCityDropdownOptions; track city) {
                      <option [value]="city">{{ city }}</option>
                    }
                  </select>
                  <button type="button" class="btn-add-pick" (click)="addReqCity()" [disabled]="!pendingReqCity">+ Add</button>
                </div>
                @if (selectedReqCities.length) {
                  <div class="multi-pick-tags">
                    @for (city of selectedReqCities; track city; let i = $index) {
                      <span class="multi-pick-tag">{{ city }}<button type="button" (click)="removeReqCity(i)" aria-label="Remove">✕</button></span>
                    }
                  </div>
                }
                @if (!isAdminForm) {
                  <app-option-request fieldKey="city" fieldLabel="Partner City" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>
              <div class="form-group">
                <label class="form-label">Preferred Education</label>
                <div class="multi-pick-row">
                  <select class="form-select" [(ngModel)]="pendingReqEducation" name="pending_req_education">
                    <option value="">Any</option>
                    @for (e of reqEducationDropdownOptions; track e) {
                      <option [value]="e">{{ e }}</option>
                    }
                  </select>
                  <button type="button" class="btn-add-pick" (click)="addReqEducation()" [disabled]="!pendingReqEducation">+ Add</button>
                </div>
                @if (selectedReqEducations.length) {
                  <div class="multi-pick-tags">
                    @for (e of selectedReqEducations; track e; let i = $index) {
                      <span class="multi-pick-tag">{{ e }}<button type="button" (click)="removeReqEducation(i)" aria-label="Remove">✕</button></span>
                    }
                  </div>
                }
                @if (!isAdminForm) {
                  <app-option-request fieldKey="education" fieldLabel="Partner Education" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>
              <div class="form-group">
                <label class="form-label">Preferred Profession</label>
                <div class="profession-section">
                  <div class="profession-category-row">
                    <label class="profession-category" [class.active]="!reqProfessionCategory && !selectedReqProfessions.length">
                      <input
                        type="radio"
                        name="req_profession_category"
                        [checked]="!reqProfessionCategory && !selectedReqProfessions.length"
                        (change)="clearReqProfessionPreference()"
                      />
                      <span>Any</span>
                    </label>
                    @for (cat of professionCategories; track cat) {
                      <label class="profession-category" [class.active]="reqProfessionCategory === cat">
                        <input type="radio" [value]="cat" [(ngModel)]="reqProfessionCategory" name="req_profession_category" (ngModelChange)="onReqProfessionCategoryChange($event)" />
                        <span>{{ cat }}</span>
                      </label>
                    }
                  </div>
                  @if (reqProfessionCategory) {
                    <div class="multi-pick-row">
                      <select class="form-select" [(ngModel)]="reqProfessionChoice" name="req_profession_choice" (ngModelChange)="onReqProfessionChoiceChange($event)">
                        <option value="">Any</option>
                        @for (p of reqProfessionSelectOptions; track p) {
                          <option [value]="p">{{ p }}</option>
                        }
                      </select>
                      @if (reqProfessionChoice === professionOther && isAdminForm) {
                        <input class="form-input" [(ngModel)]="reqProfessionOtherText" name="req_profession_other" placeholder="Enter profession" />
                      }
                      <button
                        type="button"
                        class="btn-add-pick"
                        (click)="addReqProfession()"
                        [disabled]="!canAddReqProfession"
                      >+ Add</button>
                    </div>
                  }
                </div>
                @if (selectedReqProfessions.length) {
                  <div class="multi-pick-tags">
                    @for (p of selectedReqProfessions; track p; let i = $index) {
                      <span class="multi-pick-tag">{{ p }}<button type="button" (click)="removeReqProfession(i)" aria-label="Remove">✕</button></span>
                    }
                  </div>
                }
                @if (!isAdminForm) {
                  <app-option-request fieldKey="profession" fieldLabel="Partner Profession" [category]="reqProfessionCategory" [userName]="displayName" [userEmail]="accountEmail" />
                }
              </div>
              <div class="form-group">
                <label class="form-label">Preferred Marital Status</label>
                <select class="form-select" [(ngModel)]="requirements.marital_status" name="req_marital">
                  <option value="">Any</option>
                  <option value="never_married">Single</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                  <option value="separated">Separated</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Additional Requirements</label>
                <textarea class="form-textarea" [class.input-invalid]="formErrors.show('req_notes')" [(ngModel)]="requirements.requirements_notes" name="req_notes" rows="3"
                  placeholder="Any other preferences — family values, lifestyle, location flexibility, etc."
                  (blur)="formErrors.touch('req_notes')" (ngModelChange)="formErrors.clear('req_notes')"></textarea>
                <app-field-error [message]="formErrors.message('req_notes')" />
              </div>
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">💬</span>
              <div>
                <h3>About You</h3>
                <p>Optional — tell families a little more if you like</p>
              </div>
            </div>
            <div class="section-body">
              <div class="form-group">
                <label class="form-label">About Me</label>
                <textarea class="form-textarea" [class.input-invalid]="formErrors.show('about_me')" [(ngModel)]="profile.about_me" name="about" rows="4"
                  placeholder="Tell about yourself, your values, and what makes you unique (optional)"
                  (blur)="formErrors.touch('about_me')" (ngModelChange)="formErrors.clear('about_me')"></textarea>
                <app-field-error [message]="formErrors.message('about_me')" />
              </div>
            </div>
          </section>

          <section class="section-card card">
            <div class="section-head">
              <span class="section-icon">👨‍👩‍👧</span>
              <div>
                <h3>Family Details *</h3>
                <p>Father, mother, brothers and sisters</p>
              </div>
            </div>
            <div class="section-body">
              <div class="family-grid">
                <div class="family-card">
                  <h4>Father</h4>
                  <div class="form-group">
                    <label class="form-label">Father name</label>
                    <input class="form-input" [(ngModel)]="family.father.name" name="father_name" placeholder="Enter father name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Alive *</label>
                      <select class="form-select" [class.input-invalid]="formErrors.show('family_details') && !family.father.alive" [(ngModel)]="family.father.alive" name="father_alive" (ngModelChange)="formErrors.clear('family_details')">
                        <option value="">Select</option>
                        <option value="alive">Alive</option>
                        <option value="late">Late</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Profession</label>
                      <select class="form-select" [(ngModel)]="family.father.profession" name="father_job">
                        <option value="">Select profession</option>
                        @for (job of fatherProfessionOptions; track job) {
                          <option [value]="job">{{ job }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>
                <div class="family-card">
                  <h4>Mother</h4>
                  <div class="form-group">
                    <label class="form-label">Mother name</label>
                    <input class="form-input" [(ngModel)]="family.mother.name" name="mother_name" placeholder="Enter mother name" />
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Alive *</label>
                      <select class="form-select" [class.input-invalid]="formErrors.show('family_details') && !family.mother.alive" [(ngModel)]="family.mother.alive" name="mother_alive" (ngModelChange)="formErrors.clear('family_details')">
                        <option value="">Select</option>
                        <option value="alive">Alive</option>
                        <option value="late">Late</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Profession</label>
                      <select class="form-select" [(ngModel)]="family.mother.profession" name="mother_job">
                        <option value="">Select profession</option>
                        @for (job of motherProfessionOptions; track job) {
                          <option [value]="job">{{ job }}</option>
                        }
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div class="family-siblings">
                <div class="family-sib-head">
                  <div>
                    <h4>Brothers</h4>
                    <p class="family-count">{{ brotherCounts.total }} total · {{ brotherCounts.married }} married</p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" (click)="addBrother()">+ Add brother</button>
                </div>
                @for (b of family.brothers; track b.id; let i = $index) {
                  <div class="sibling-row">
                    <span class="sib-num">{{ i + 1 }}</span>
                    <select class="form-select" [(ngModel)]="b.order" [name]="'bro_order_' + b.id">
                      <option value="">Elder / Younger</option>
                      <option value="elder">Elder</option>
                      <option value="younger">Younger</option>
                    </select>
                    <select class="form-select" [(ngModel)]="b.married" [name]="'bro_mar_' + b.id">
                      <option value="">Married?</option>
                      <option value="married">Married</option>
                      <option value="unmarried">Unmarried</option>
                    </select>
                    <select class="form-select" [(ngModel)]="b.profession" [name]="'bro_job_' + b.id">
                      <option value="">Profession</option>
                      @for (job of brotherProfessionOptions(b.profession); track job) {
                        <option [value]="job">{{ job }}</option>
                      }
                    </select>
                    <button type="button" class="sib-remove" (click)="removeBrother(i)" aria-label="Remove brother">✕</button>
                  </div>
                }
                @if (!family.brothers.length) {
                  <p class="family-empty">No brothers added</p>
                }
              </div>

              <div class="family-siblings">
                <div class="family-sib-head">
                  <div>
                    <h4>Sisters</h4>
                    <p class="family-count">{{ sisterCounts.total }} total · {{ sisterCounts.married }} married</p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" (click)="addSister()">+ Add sister</button>
                </div>
                @for (s of family.sisters; track s.id; let i = $index) {
                  <div class="sibling-row">
                    <span class="sib-num">{{ i + 1 }}</span>
                    <select class="form-select" [(ngModel)]="s.order" [name]="'sis_order_' + s.id">
                      <option value="">Elder / Younger</option>
                      <option value="elder">Elder</option>
                      <option value="younger">Younger</option>
                    </select>
                    <select class="form-select" [(ngModel)]="s.married" [name]="'sis_mar_' + s.id">
                      <option value="">Married?</option>
                      <option value="married">Married</option>
                      <option value="unmarried">Unmarried</option>
                    </select>
                    <select class="form-select" [(ngModel)]="s.profession" [name]="'sis_job_' + s.id">
                      <option value="">Profession</option>
                      @for (job of sisterProfessionOptions(s.profession); track job) {
                        <option [value]="job">{{ job }}</option>
                      }
                    </select>
                    <button type="button" class="sib-remove" (click)="removeSister(i)" aria-label="Remove sister">✕</button>
                  </div>
                }
                @if (!family.sisters.length) {
                  <p class="family-empty">No sisters added</p>
                }
              </div>
              <app-field-error [message]="formErrors.message('family_details')" />
            </div>
          </section>

          <div class="form-actions card">
            <div class="form-actions-copy">
              <p class="form-actions-hint">
                @if (isAdminForm) {
                  Fields optional — empty values show as --- on the site.
                } @else {
                  Review your details before saving. A complete profile gets more responses.
                }
              </p>
              @if (message() && messageType() === 'error') {
                <p class="save-inline-error">{{ message() }}</p>
              }
            </div>
            <div class="form-actions-btns">
              <button class="btn btn-primary btn-lg save-btn" type="button" (click)="save()" [disabled]="saving()">
                @if (saving()) {
                  <span class="btn-spinner"></span> Saving...
                } @else if (adminCreateMode()) {
                  Create Profile
                } @else {
                  Save Profile
                }
              </button>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .profile-page {
      padding-top: 0;
      max-width: 860px;
      margin: 0 auto;
    }

    .alert-float {
      margin-bottom: 1.25rem;
      border-radius: 10px;
      font-weight: 500;
      position: sticky;
      top: 0.75rem;
      z-index: 30;
    }

    .profile-top {
      display: flex;
      align-items: center;
      gap: 1.75rem;
      padding: 1.75rem 2rem;
      margin-bottom: 1.5rem;
      background: linear-gradient(135deg, #fff 0%, #FFF8F3 100%);
      border: 1px solid rgba(212, 175, 55, 0.25);
      position: relative;
      overflow: visible;
    }
    .photo-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.65rem;
      flex-shrink: 0;
    }
    .photo-actions {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }
    .photo-upload-btn { cursor: pointer; margin: 0; }
    .photo-hint {
      font-size: 0.72rem;
      color: var(--text-muted);
      margin: 0;
      text-align: center;
      max-width: 140px;
    }
    .btn-link-muted {
      border: none;
      background: none;
      color: var(--text-muted);
      font-size: 0.78rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
      font-family: var(--font);
    }
    .lang-section { display: flex; flex-direction: column; gap: 0.85rem; }
    .lang-pick-hint {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0;
    }
    .lang-category-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }
    .lang-category {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.65rem 1rem;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      font-size: 0.92rem;
      font-weight: 600;
      transition: border-color 0.15s, background 0.15s;
    }
    .lang-category input { accent-color: var(--primary); }
    .lang-category.active {
      border-color: var(--primary);
      background: rgba(155, 27, 48, 0.06);
      color: var(--primary);
    }
    .lang-group-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--primary);
      margin: 0.35rem 0 0;
    }
    .lang-selected-summary {
      font-size: 0.84rem;
      color: var(--text-muted);
      margin: 0;
      padding: 0.55rem 0.75rem;
      background: rgba(155, 27, 48, 0.05);
      border-radius: 8px;
      color: var(--text);
    }
    .lang-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      max-height: 220px;
      overflow-y: auto;
      padding: 0.35rem 0.15rem 0.5rem;
    }
    .lang-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.85rem;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      font-size: 0.88rem;
      transition: border-color 0.15s, background 0.15s;
    }
    .lang-chip input { accent-color: var(--primary); }
    .lang-chip.active {
      border-color: var(--primary);
      background: rgba(155, 27, 48, 0.06);
      color: var(--primary);
    }
    .profession-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }
    .profession-category-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }
    .profession-category {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.65rem 1rem;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: border-color 0.15s, background 0.15s;
    }
    .profession-category input { accent-color: var(--primary); }
    .profession-category.active {
      border-color: var(--primary);
      background: rgba(155, 27, 48, 0.06);
      color: var(--primary);
    }
    .multi-pick-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      align-items: center;
    }
    .multi-pick-row .form-select,
    .multi-pick-row .form-input {
      flex: 1 1 180px;
      min-width: 0;
    }
    .btn-add-pick {
      flex: 0 0 auto;
      padding: 0.55rem 0.95rem;
      border: 1.5px solid var(--primary);
      border-radius: 8px;
      background: rgba(155, 27, 48, 0.06);
      color: var(--primary);
      font-weight: 700;
      font-size: 0.88rem;
      cursor: pointer;
      transition: background 0.15s, opacity 0.15s;
    }
    .btn-add-pick:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .btn-add-pick:not(:disabled):hover {
      background: rgba(155, 27, 48, 0.12);
    }
    .multi-pick-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin-top: 0.55rem;
    }
    .multi-pick-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.55rem 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(155, 27, 48, 0.08);
      border: 1px solid rgba(155, 27, 48, 0.18);
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--text);
    }
    .multi-pick-tag button {
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.82rem;
      line-height: 1;
      padding: 0.1rem 0.25rem;
    }
    .multi-pick-tag button:hover { color: var(--primary); }
    .residence-section { margin-bottom: 0.5rem; }
    .residence-block {
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border);
    }
    .profile-top::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: var(--gradient-gold);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }
    .profile-top-info { flex: 1; min-width: 0; }
    .profile-top-info h2 {
      font-size: 1.45rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.25rem;
    }
    .profile-top-meta {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .completion-wrap { max-width: 320px; }
    .completion-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-bottom: 0.4rem;
    }
    .completion-label strong { color: var(--primary); }
    .completion-bar {
      height: 8px;
      background: var(--border);
      border-radius: 50px;
      overflow: hidden;
    }
    .completion-fill {
      height: 100%;
      background: var(--gradient-wedding);
      border-radius: 50px;
      transition: width 0.4s ease;
    }

    .profile-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .section-card {
      border: 1px solid var(--border);
      transition: box-shadow 0.25s ease, border-color 0.25s ease;
    }
    .section-card:hover {
      border-color: rgba(212, 175, 55, 0.35);
      box-shadow: var(--shadow-lg);
    }

    .section-head {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(90deg, rgba(155, 27, 48, 0.04) 0%, transparent 100%);
      border-bottom: 1px solid var(--border);
    }
    .section-icon {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      background: #fff;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(155, 27, 48, 0.06);
      flex-shrink: 0;
    }
    .section-head h3 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--primary);
      margin-bottom: 0.1rem;
    }
    .section-head p {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0;
    }

    .section-body {
      padding: 1.5rem;
    }
    .section-body .form-group:last-child { margin-bottom: 0; }

    .section-body .form-input,
    .section-body .form-select,
    .section-body .form-textarea {
      background: #FDFAF8;
      border-color: #EDE0D6;
    }
    .section-body .form-input:hover,
    .section-body .form-select:hover,
    .section-body .form-textarea:hover {
      border-color: rgba(155, 27, 48, 0.25);
    }
    .section-body .form-input:focus,
    .section-body .form-select:focus,
    .section-body .form-textarea:focus {
      background: #fff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(155, 27, 48, 0.08);
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #FFF8F3 0%, #fff 100%);
      border: 1px solid rgba(212, 175, 55, 0.25);
      flex-wrap: wrap;
    }
    .form-actions-copy { flex: 1; min-width: 200px; }
    .form-actions-hint {
      flex: 1;
      font-size: 0.88rem;
      color: var(--text-muted);
      margin: 0;
      min-width: 200px;
    }
    .save-inline-error {
      margin: 0.55rem 0 0;
      color: #b91c1c;
      font-weight: 700;
      font-size: 0.92rem;
      line-height: 1.4;
    }
    .field-hint {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 0.25rem 0 0;
    }
    .form-actions-btns {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: flex-end;
    }
    .save-btn {
      min-width: 180px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      box-shadow: 0 4px 16px rgba(155, 27, 48, 0.25);
    }
    .save-btn:disabled { opacity: 0.75; cursor: not-allowed; }
    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .contact-row {
      display: grid;
      grid-template-columns: 140px 1fr auto;
      gap: 1rem;
      align-items: end;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px dashed var(--border);
    }
    .contact-row:last-of-type { border-bottom: none; margin-bottom: 0.5rem; }
    .contact-row .form-group { margin-bottom: 0; }
    .height-row {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-wrap: wrap;
    }
    .height-row .form-select { flex: 1; min-width: 90px; }
    .height-preview {
      font-weight: 700;
      color: var(--primary);
      font-size: 0.95rem;
      white-space: nowrap;
      padding: 0.5rem 0.75rem;
      background: rgba(155, 27, 48, 0.06);
      border-radius: 8px;
    }
    .btn-remove {
      width: 42px;
      height: 42px;
      margin-bottom: 0.1rem;
      border: 1px solid #FECACA;
      background: #FEF2F2;
      color: #B91C1C;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s ease;
    }
    .btn-remove:hover { background: #FEE2E2; border-color: #F87171; }
    .btn-add-contact {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin-top: 0.75rem;
      padding: 0.55rem 1.1rem;
      border: 1.5px dashed rgba(155, 27, 48, 0.35);
      background: rgba(155, 27, 48, 0.04);
      color: var(--primary);
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.88rem;
      font-family: var(--font);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .btn-add-contact:hover {
      background: rgba(155, 27, 48, 0.08);
      border-color: var(--primary);
    }

    .admin-edit-bar {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .gender-pick {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .gender-option {
      flex: 1;
      min-width: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      border: 2px solid var(--border);
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      background: #fff;
      transition: border-color 0.15s, background 0.15s;
    }
    .gender-option input { position: absolute; opacity: 0; pointer-events: none; }
    .gender-option.active {
      border-color: var(--primary);
      background: rgba(155, 27, 48, 0.06);
      color: var(--primary);
    }
    .input-invalid-wrap .gender-option {
      border-color: #dc2626;
    }

    .family-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .family-card {
      background: linear-gradient(180deg, #FFF8F3 0%, #fff 100%);
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 14px;
      padding: 1rem 1.1rem 0.35rem;
      box-shadow: 0 4px 14px rgba(155, 27, 48, 0.05);
    }
    .family-card h4,
    .family-sib-head h4 {
      margin: 0 0 0.75rem;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--primary);
    }
    .family-siblings {
      margin-top: 0.35rem;
      padding: 1rem 1.1rem;
      background: #FDFAF8;
      border: 1px solid #EDE0D6;
      border-radius: 14px;
    }
    .family-siblings + .family-siblings { margin-top: 1rem; }
    .family-sib-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
    }
    .family-count {
      margin: 0.15rem 0 0;
      font-size: 0.8rem;
      font-weight: 600;
      color: #b45309;
    }
    .family-empty {
      margin: 0;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .sibling-row {
      display: grid;
      grid-template-columns: 1.75rem 1fr 1fr 1.4fr auto;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.55rem;
    }
    .sib-num {
      width: 1.75rem;
      height: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      background: var(--primary);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .sib-remove {
      width: 2rem;
      height: 2rem;
      border: 1px solid #fecaca;
      background: #fff;
      color: #dc2626;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .sib-remove:hover { background: #fef2f2; }

    @media (max-width: 640px) {
      .profile-top {
        flex-direction: column;
        text-align: center;
        padding: 1.5rem 1.25rem;
      }
      .completion-wrap { margin: 0 auto; width: 100%; }
      .section-head { padding: 1rem 1.25rem; }
      .section-body { padding: 1.25rem; }
      .form-actions {
        flex-direction: column;
        text-align: center;
      }
      .save-btn { width: 100%; }
      .contact-row { grid-template-columns: 1fr; }
      .btn-remove { width: 100%; margin-bottom: 0; }
      .family-grid { grid-template-columns: 1fr; }
      .sibling-row { grid-template-columns: 1.75rem 1fr auto; }
      .sibling-row .form-select,
      .sibling-row .form-input { grid-column: 1 / -1; }
      .sibling-row .sib-num { grid-row: 1; }
      .sibling-row .sib-remove { grid-row: 1; grid-column: 3; }
    }
  `],
})
export class MyProfileComponent implements OnInit {
  private readonly profileService = inject(ProfileService);
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly dropdownService = inject(DropdownService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  adminEditId = signal<string | null>(null);
  adminCreateMode = signal(false);
  profile: Partial<Profile> = {};
  fullName = '';
  selectedLanguages: string[] = [];
  showPakistanLanguages = false;
  showInternationalLanguages = false;
  showPakistanResidence = true;
  showAbroadResidence = false;
  pkHouseType: '' | 'own' | 'rent' = '';
  pkHouseLocation = '';
  abroadHouseType: '' | 'own' | 'rent' = '';
  abroadHouseLocation = '';
  professionCategory = '';
  professionChoice = '';
  professionOtherText = '';
  family: FamilyDetails = emptyFamilyDetails();
  reqProfessionCategory = '';
  reqProfessionChoice = '';
  reqProfessionOtherText = '';
  accountEmail = '';
  selectedReqCastes: string[] = [];
  selectedReqStates: string[] = [];
  selectedReqCities: string[] = [];
  selectedReqEducations: string[] = [];
  selectedReqProfessions: string[] = [];
  selectedReqCountries: string[] = [];
  pendingReqCaste = '';
  pendingReqState = '';
  pendingReqCity = '';
  pendingReqEducation = '';
  pendingReqCountry = '';
  contacts: ProfileContact[] = [{ type: 'phone', number: '' }];
  requirements: PartnerPreferences = {};
  readonly feetOptions = [...HEIGHT_FEET_OPTIONS];
  readonly inchesOptions = [...HEIGHT_INCHES_OPTIONS];
  heightFeet: number | null = null;
  heightInches: number | null = null;
  reqMinFeet: number | null = null;
  reqMinInches: number | null = null;
  reqMaxFeet: number | null = null;
  reqMaxInches: number | null = null;
  disabilityChoice: '' | 'No' | 'Yes' = '';
  disabilityDetails = '';
  loading = signal(true);
  saving = signal(false);
  uploadingPhoto = signal(false);
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  readonly formErrors = new FormErrorState();
  provinces = [...ALL_LOCATION_PROVINCES];
  pakistanProvinces = [...PAKISTAN_PROVINCES];
  readonly provinceLabel = provinceLabel;
  readonly religionOptions = [...RELIGION_OPTIONS];
  readonly pakistanLanguages = [...PAKISTAN_LANGUAGES];
  readonly internationalLanguages = [...INTERNATIONAL_LANGUAGES];
  readonly colorOptions = ['Very Fair', 'Fair', 'Wheatish', 'Dull Wheatish', 'Dark'];
  readonly professionCategories = [...PROFESSION_CATEGORIES];
  readonly professionOther = PROFESSION_OTHER;
  /** Extra options added by admin (field_key -> labels, profession uses category::label) */
  private customOptions: Record<string, string[]> = {};

  get educationOptions(): string[] {
    return this.mergeExtra(educationOptionsWithValue(this.profile.education), 'education');
  }

  get reqProfessionSelectOptions(): string[] {
    const opts = this.mergeExtra(
      professionsForCategory(this.reqProfessionCategory),
      'profession',
      this.reqProfessionCategory,
    );
    return this.isAdminForm ? opts : opts.filter((p) => p !== this.professionOther);
  }

  get canAddReqProfession(): boolean {
    if (!this.reqProfessionCategory || !this.reqProfessionChoice) return false;
    if (this.reqProfessionChoice === this.professionOther) {
      return !!this.reqProfessionOtherText.trim();
    }
    return true;
  }

  get showReqOverseasCountries(): boolean {
    return this.selectedReqStates.some((s) => isOverseasProvince(s));
  }

  get reqCasteDropdownOptions(): string[] {
    const opts = new Set(this.mergeExtra(casteOptionsWithValue(null), 'caste'));
    for (const c of this.selectedReqCastes) opts.add(c);
    return [...opts];
  }

  get reqStateDropdownOptions(): string[] {
    const opts = new Set(this.mergeExtra([...ALL_LOCATION_PROVINCES], 'state'));
    for (const s of this.selectedReqStates) opts.add(s);
    return [...opts];
  }

  get reqEducationDropdownOptions(): string[] {
    const opts = new Set(this.mergeExtra([...EDUCATION_OPTIONS], 'education'));
    for (const e of this.selectedReqEducations) opts.add(e);
    return [...opts];
  }

  get reqCityDropdownOptions(): string[] {
    const opts = new Set<string>();
    // Preferred cities only from selected preferred state(s).
    for (const prov of this.selectedReqStates) {
      if (!isOverseasProvince(prov)) {
        for (const city of citiesForProvince(prov)) opts.add(city);
      }
    }
    // Keep already-selected cities visible even if state was cleared (so user can remove them).
    for (const city of this.selectedReqCities) opts.add(city);
    return [...opts].sort((a, b) => a.localeCompare(b));
  }

  get casteOptions(): string[] {
    return this.mergeExtra(casteOptionsWithValue(this.profile.caste), 'caste');
  }

  get professionSelectOptions(): string[] {
    const opts = this.mergeExtra(
      professionOptionsWithValue(this.professionCategory, this.profile.profession),
      'profession',
      this.professionCategory,
    );
    return this.isAdminForm ? opts : opts.filter((p) => p !== this.professionOther);
  }

  get isAdminForm(): boolean {
    return !!(this.adminEditId() || this.adminCreateMode());
  }

  get displayName(): string {
    return this.fullName.trim() || joinFullName(this.profile.first_name, this.profile.last_name);
  }

  get pageTitle(): string {
    if (this.adminCreateMode()) return 'Add Profile';
    if (this.adminEditId()) return 'Edit Profile';
    return 'My Profile';
  }

  get pageSubtitle(): string {
    if (this.isAdminForm) return 'Admin — edit any field (empty shows as ---)';
    return 'میرا پروفائل';
  }

  get isOverseasLocation(): boolean {
    return isOverseasProvince(this.profile.province);
  }

  get availableSects(): string[] {
    return sectsForReligion(this.profile.religion);
  }

  get sectSuggestions(): string[] {
    return this.availableSects.length ? this.availableSects : [...ALL_SECT_OPTIONS];
  }

  get availableReqSects(): string[] {
    return sectsForReligion(this.requirements.religion);
  }

  get reqSectSuggestions(): string[] {
    return this.availableReqSects.length ? this.availableReqSects : [...ALL_SECT_OPTIONS];
  }

  private readonly completionFields: (keyof Profile)[] = [
    'first_name', 'gender', 'date_of_birth', 'height_cm', 'weight_kg',
    'marital_status', 'color', 'disability', 'religion', 'sect', 'caste',
    'guardian_type', 'guardian_name', 'languages',
    'city', 'province', 'education', 'profession', 'hafiz_quran',
  ];

  private isFilled(value: unknown): boolean {
    const text = String(value ?? '').trim();
    return text !== '' && text !== '---';
  }

  get completionPercent(): number {
    const p = this.profile;
    const filled = this.completionFields.filter((key) => {
      if (key === 'first_name') {
        return this.fullName.trim() !== '';
      }
      if (key === 'languages') {
        return this.selectedLanguages.length > 0;
      }
      return this.isFilled(p[key]);
    }).length;
    const hasPhone = this.contacts.some((c) => c.type === 'phone' && c.number.trim());
    const hasRequiredPartnerAge = (
      this.requirements.min_age != null && this.requirements.max_age != null
    );
    const hasResidence = this.showPakistanResidence
      ? !!this.pkHouseType && this.pkHouseLocation.trim().length >= 5
      : (
        this.showAbroadResidence
        && !!this.profile.abroad_country
        && !!this.abroadHouseType
        && this.abroadHouseLocation.trim().length >= 5
      );
    const familyDone = isFamilyDetailsComplete(this.family);
    const total = this.completionFields.length + 4;
    const done = filled
      + (hasPhone ? 1 : 0)
      + (hasRequiredPartnerAge ? 1 : 0)
      + (hasResidence ? 1 : 0)
      + (familyDone ? 1 : 0);
    return Math.round((done / total) * 100);
  }

  get brotherCounts(): { total: number; married: number; unmarried: number } {
    return familyCounts(this.family.brothers);
  }

  get sisterCounts(): { total: number; married: number; unmarried: number } {
    return familyCounts(this.family.sisters);
  }

  get fatherProfessionOptions(): string[] {
    return familyProfessionOptions('father', this.family.father.profession);
  }

  get motherProfessionOptions(): string[] {
    return familyProfessionOptions('mother', this.family.mother.profession);
  }

  brotherProfessionOptions(current?: string): string[] {
    return familyProfessionOptions('brother', current);
  }

  sisterProfessionOptions(current?: string): string[] {
    return familyProfessionOptions('sister', current);
  }

  addBrother(): void {
    this.family.brothers = [...this.family.brothers, emptySibling()];
  }

  addSister(): void {
    this.family.sisters = [...this.family.sisters, emptySibling()];
  }

  removeBrother(index: number): void {
    this.family.brothers = this.family.brothers.filter((_, i) => i !== index);
  }

  removeSister(index: number): void {
    this.family.sisters = this.family.sisters.filter((_, i) => i !== index);
  }

  get availableCities(): string[] {
    if (!this.profile.province || isOverseasProvince(this.profile.province)) {
      return [];
    }
    // Only cities for the selected province — do not merge global dropdown city list
    // (that mixes Punjab/Sindh/Islamabad cities together).
    const cities = [...citiesForProvince(this.profile.province)];
    const current = (this.profile.city || '').trim();
    if (current && current !== '---' && !cities.includes(current)) {
      return [current, ...cities];
    }
    return cities;
  }

  get overseasCountries(): string[] {
    return this.mergeExtra([...OVERSEAS_COUNTRIES], 'country');
  }

  get heightPreview(): string {
    return formatFeetInches(this.heightFeet, this.heightInches);
  }

  syncProfileHeight(): void {
    if (this.heightFeet !== null) {
      const inches = this.heightInches ?? 0;
      this.profile.height_cm = feetInchesToCm(this.heightFeet, inches);
    } else {
      this.profile.height_cm = undefined;
      this.heightInches = null;
    }
  }

  onHeightFeetChange(feet: number | null): void {
    this.heightFeet = feet;
    if (feet !== null && this.heightInches === null) {
      this.heightInches = 0;
    }
    this.syncProfileHeight();
  }

  onDisabilityChoice(choice: '' | 'No' | 'Yes'): void {
    this.disabilityChoice = choice;
    if (choice !== 'Yes') {
      this.disabilityDetails = '';
    }
    this.syncDisabilityField();
  }

  syncDisabilityField(): void {
    if (this.disabilityChoice === 'No') {
      this.profile.disability = 'No';
    } else if (this.disabilityChoice === 'Yes') {
      const detail = this.disabilityDetails.trim();
      this.profile.disability = detail || 'Yes';
    } else {
      this.profile.disability = undefined;
    }
  }

  private loadDisabilityFields(): void {
    const raw = (this.profile.disability || '').trim();
    if (!raw) {
      this.disabilityChoice = '';
      this.disabilityDetails = '';
      return;
    }
    if (/^(no|none|nil|non|n\/?a)$/i.test(raw)) {
      this.disabilityChoice = 'No';
      this.disabilityDetails = '';
      this.profile.disability = 'No';
      return;
    }
    this.disabilityChoice = 'Yes';
    this.disabilityDetails = /^yes$/i.test(raw) ? '' : raw;
  }

  syncReqMinHeight(): void {
    if (this.reqMinFeet !== null) {
      const inches = this.reqMinInches ?? 0;
      this.requirements.min_height_cm = feetInchesToCm(this.reqMinFeet, inches);
    } else {
      this.requirements.min_height_cm = undefined;
      this.reqMinInches = null;
    }
    this.formErrors.clear('req_height');
  }

  onReqMinFeetChange(feet: number | null): void {
    this.reqMinFeet = feet;
    if (feet !== null && this.reqMinInches === null) {
      this.reqMinInches = 0;
    }
    this.syncReqMinHeight();
  }

  syncReqMaxHeight(): void {
    if (this.reqMaxFeet !== null) {
      const inches = this.reqMaxInches ?? 0;
      this.requirements.max_height_cm = feetInchesToCm(this.reqMaxFeet, inches);
    } else {
      this.requirements.max_height_cm = undefined;
      this.reqMaxInches = null;
    }
    this.formErrors.clear('req_height');
  }

  onReqMaxFeetChange(feet: number | null): void {
    this.reqMaxFeet = feet;
    if (feet !== null && this.reqMaxInches === null) {
      this.reqMaxInches = 0;
    }
    this.syncReqMaxHeight();
  }

  private loadHeightFields(): void {
    const h = parseFeetInchesFromCm(this.profile.height_cm);
    this.heightFeet = h.feet;
    this.heightInches = h.inches;

    const minH = parseFeetInchesFromCm(this.requirements.min_height_cm);
    this.reqMinFeet = minH.feet;
    this.reqMinInches = minH.inches;

    const maxH = parseFeetInchesFromCm(this.requirements.max_height_cm);
    this.reqMaxFeet = maxH.feet;
    this.reqMaxInches = maxH.inches;
  }

  onProvinceChange(province: string): void {
    if (isOverseasProvince(province)) {
      this.profile.country = this.profile.country && this.profile.country !== 'Pakistan'
        ? this.profile.country
        : '';
      this.profile.city = undefined;
    } else {
      this.profile.country = 'Pakistan';
      const allowed = citiesForProvince(province);
      if (this.profile.city && !allowed.includes(this.profile.city)) {
        this.profile.city = '';
      }
    }
    this.formErrors.clear('city');
    this.formErrors.clear('country');
  }

  onResidenceCategoryChange(): void {
    if (!this.showPakistanResidence) {
      this.profile.province = undefined;
      this.profile.city = undefined;
      this.pkHouseType = '';
      this.pkHouseLocation = '';
      this.profile.house_own_location = undefined;
      this.profile.house_rent_location = undefined;
    }
    if (!this.showAbroadResidence) {
      this.profile.abroad_country = undefined;
      this.abroadHouseType = '';
      this.abroadHouseLocation = '';
      this.profile.abroad_house_own_location = undefined;
      this.profile.abroad_house_rent_location = undefined;
    }
    this.formErrors.clear('residence');
    this.formErrors.clear('province');
    this.formErrors.clear('city');
    this.formErrors.clear('abroad_country');
  }

  onReligionChange(religion: string): void {
    const allowed = sectsForReligion(religion);
    if (this.profile.sect && allowed.length && !allowed.includes(this.profile.sect)) {
      this.profile.sect = '';
    }
  }

  onReqReligionChange(religion: string): void {
    const allowed = sectsForReligion(religion);
    if (this.requirements.sect && allowed.length && !allowed.includes(this.requirements.sect)) {
      this.requirements.sect = '';
    }
  }

  addReqCaste(): void {
    const value = this.pendingReqCaste.trim();
    if (!value || this.selectedReqCastes.includes(value)) return;
    this.selectedReqCastes = [...this.selectedReqCastes, value];
    this.pendingReqCaste = '';
  }

  removeReqCaste(index: number): void {
    this.selectedReqCastes = this.selectedReqCastes.filter((_, i) => i !== index);
  }

  addReqState(): void {
    const value = this.pendingReqState.trim();
    if (!value || this.selectedReqStates.includes(value)) return;
    this.selectedReqStates = [...this.selectedReqStates, value];
    this.pendingReqState = '';
  }

  removeReqState(index: number): void {
    this.selectedReqStates = this.selectedReqStates.filter((_, i) => i !== index);
    if (!this.showReqOverseasCountries) {
      this.selectedReqCountries = [];
      this.pendingReqCountry = '';
    }
    const allowed = new Set<string>();
    for (const prov of this.selectedReqStates) {
      if (!isOverseasProvince(prov)) {
        for (const city of citiesForProvince(prov)) allowed.add(city);
      }
    }
    this.selectedReqCities = this.selectedReqCities.filter((c) => allowed.has(c));
    if (this.pendingReqCity && !allowed.has(this.pendingReqCity)) {
      this.pendingReqCity = '';
    }
  }

  addReqCountry(): void {
    const value = this.pendingReqCountry.trim();
    if (!value || this.selectedReqCountries.includes(value)) return;
    this.selectedReqCountries = [...this.selectedReqCountries, value];
    this.pendingReqCountry = '';
  }

  removeReqCountry(index: number): void {
    this.selectedReqCountries = this.selectedReqCountries.filter((_, i) => i !== index);
  }

  addReqCity(): void {
    const value = this.pendingReqCity.trim();
    if (!value || this.selectedReqCities.includes(value)) return;
    this.selectedReqCities = [...this.selectedReqCities, value];
    this.pendingReqCity = '';
  }

  removeReqCity(index: number): void {
    this.selectedReqCities = this.selectedReqCities.filter((_, i) => i !== index);
  }

  addReqEducation(): void {
    const value = this.pendingReqEducation.trim();
    if (!value || this.selectedReqEducations.includes(value)) return;
    this.selectedReqEducations = [...this.selectedReqEducations, value];
    this.pendingReqEducation = '';
  }

  removeReqEducation(index: number): void {
    this.selectedReqEducations = this.selectedReqEducations.filter((_, i) => i !== index);
  }

  addReqProfession(): void {
    const label = formatProfession(
      this.reqProfessionCategory,
      this.reqProfessionChoice,
      this.reqProfessionOtherText,
    );
    if (!label || this.selectedReqProfessions.includes(label)) return;
    this.selectedReqProfessions = [...this.selectedReqProfessions, label];
    this.reqProfessionCategory = '';
    this.reqProfessionChoice = '';
    this.reqProfessionOtherText = '';
  }

  removeReqProfession(index: number): void {
    this.selectedReqProfessions = this.selectedReqProfessions.filter((_, i) => i !== index);
  }

  private syncReqMultiToRequirements(): void {
    this.requirements.caste = joinMultiSelect(this.selectedReqCastes);
    this.requirements.province = joinMultiSelect(this.selectedReqStates);
    this.requirements.city = joinMultiSelect(this.selectedReqCities);
    this.requirements.education = joinMultiSelect(this.selectedReqEducations);
    this.requirements.profession = joinMultiSelect(this.selectedReqProfessions);
    this.requirements.country = this.showReqOverseasCountries
      ? joinMultiSelect(this.selectedReqCountries)
      : undefined;
  }

  private loadReqMultiFields(): void {
    this.selectedReqCastes = parseMultiSelect(this.requirements.caste);
    this.selectedReqStates = parseMultiSelect(this.requirements.province);
    this.selectedReqCities = parseMultiSelect(this.requirements.city);
    this.selectedReqEducations = parseMultiSelect(this.requirements.education);
    this.selectedReqProfessions = parseMultiSelect(this.requirements.profession);
    this.selectedReqCountries = parseMultiSelect(this.requirements.country);
    this.pendingReqCaste = '';
    this.pendingReqState = '';
    this.pendingReqCity = '';
    this.pendingReqEducation = '';
    this.pendingReqCountry = '';
    this.reqProfessionCategory = '';
    this.reqProfessionChoice = '';
    this.reqProfessionOtherText = '';
  }

  onGuardianTypeChange(type: string): void {
    if (!type) {
      this.profile.guardian_name = undefined;
    }
  }

  isLanguageSelected(lang: string): boolean {
    return this.selectedLanguages.includes(lang);
  }

  onLanguageCategoryChange(): void {
    const pkSet = new Set<string>(this.pakistanLanguages);
    const intlSet = new Set<string>(this.internationalLanguages);
    if (!this.showPakistanLanguages) {
      this.selectedLanguages = this.selectedLanguages.filter((l) => !pkSet.has(l));
    }
    if (!this.showInternationalLanguages) {
      this.selectedLanguages = this.selectedLanguages.filter((l) => !intlSet.has(l));
    }
    this.formErrors.clear('languages');
  }

  onProfessionCategoryChange(category: string): void {
    this.professionCategory = category;
    const options = professionsForCategory(category);
    if (this.professionChoice && !options.includes(this.professionChoice)) {
      this.professionChoice = '';
      this.professionOtherText = '';
    }
    this.syncProfessionField();
    this.formErrors.clear('profession');
  }

  onProfessionChoiceChange(choice: string): void {
    this.professionChoice = choice;
    if (choice !== this.professionOther) {
      this.professionOtherText = '';
    }
    this.syncProfessionField();
    this.formErrors.clear('profession');
  }

  onReqProfessionCategoryChange(category: string): void {
    this.reqProfessionCategory = category;
    const options = professionsForCategory(category);
    if (this.reqProfessionChoice && !options.includes(this.reqProfessionChoice)) {
      this.reqProfessionChoice = '';
      this.reqProfessionOtherText = '';
    }
  }

  onReqProfessionChoiceChange(choice: string): void {
    this.reqProfessionChoice = choice;
    if (choice !== this.professionOther) {
      this.reqProfessionOtherText = '';
    }
  }

  clearReqProfessionPreference(): void {
    this.reqProfessionCategory = '';
    this.reqProfessionChoice = '';
    this.reqProfessionOtherText = '';
    this.selectedReqProfessions = [];
  }

  syncProfessionField(): void {
    this.profile.profession = formatProfession(
      this.professionCategory,
      this.professionChoice,
      this.professionOtherText,
    ) || undefined;
  }

  onPkHouseTypeChange(type: '' | 'own' | 'rent'): void {
    this.pkHouseType = type;
    this.syncPkHouseFields();
  }

  onAbroadHouseTypeChange(type: '' | 'own' | 'rent'): void {
    this.abroadHouseType = type;
    this.syncAbroadHouseFields();
  }

  syncPkHouseFields(): void {
    const loc = this.pkHouseLocation.trim();
    if (this.pkHouseType === 'own') {
      this.profile.house_own_location = loc || undefined;
      this.profile.house_rent_location = undefined;
    } else if (this.pkHouseType === 'rent') {
      this.profile.house_rent_location = loc || undefined;
      this.profile.house_own_location = undefined;
    } else {
      this.profile.house_own_location = undefined;
      this.profile.house_rent_location = undefined;
    }
  }

  syncAbroadHouseFields(): void {
    const loc = this.abroadHouseLocation.trim();
    if (this.abroadHouseType === 'own') {
      this.profile.abroad_house_own_location = loc || undefined;
      this.profile.abroad_house_rent_location = undefined;
    } else if (this.abroadHouseType === 'rent') {
      this.profile.abroad_house_rent_location = loc || undefined;
      this.profile.abroad_house_own_location = undefined;
    } else {
      this.profile.abroad_house_own_location = undefined;
      this.profile.abroad_house_rent_location = undefined;
    }
  }

  private loadPkHouseFields(): void {
    const own = (this.profile.house_own_location || '').trim();
    const rent = (this.profile.house_rent_location || '').trim();
    if (own) {
      this.pkHouseType = 'own';
      this.pkHouseLocation = own;
      return;
    }
    if (rent) {
      this.pkHouseType = 'rent';
      this.pkHouseLocation = rent;
      return;
    }
    this.pkHouseType = '';
    this.pkHouseLocation = '';
  }

  private loadAbroadHouseFields(): void {
    const own = (this.profile.abroad_house_own_location || '').trim();
    const rent = (this.profile.abroad_house_rent_location || '').trim();
    if (own) {
      this.abroadHouseType = 'own';
      this.abroadHouseLocation = own;
      return;
    }
    if (rent) {
      this.abroadHouseType = 'rent';
      this.abroadHouseLocation = rent;
      return;
    }
    this.abroadHouseType = '';
    this.abroadHouseLocation = '';
  }

  private loadResidenceFields(): void {
    const hasPk = !!(this.profile.province && !isOverseasProvince(this.profile.province));
    const abroadCountry = (this.profile.abroad_country || '').trim()
      || (isOverseasProvince(this.profile.province) && this.profile.country && this.profile.country !== 'Pakistan'
        ? this.profile.country
        : '');
    const hasAbroad = !!abroadCountry;

    this.showPakistanResidence = hasPk || (!hasPk && !hasAbroad);
    this.showAbroadResidence = hasAbroad;

    if (hasAbroad && !this.profile.abroad_country) {
      this.profile.abroad_country = abroadCountry;
    }

    this.loadPkHouseFields();
    this.loadAbroadHouseFields();
  }

  private syncResidenceToProfile(): void {
    this.syncPkHouseFields();
    this.syncAbroadHouseFields();

    if (this.showPakistanResidence) {
      this.profile.country = 'Pakistan';
    } else {
      this.profile.province = undefined;
      this.profile.city = undefined;
      this.profile.house_own_location = undefined;
      this.profile.house_rent_location = undefined;
    }

    if (this.showAbroadResidence) {
      if (!this.showPakistanResidence) {
        this.profile.province = 'Overseas';
        this.profile.city = '---';
        this.profile.country = this.profile.abroad_country || '---';
      }
    } else {
      this.profile.abroad_country = undefined;
      this.profile.abroad_house_own_location = undefined;
      this.profile.abroad_house_rent_location = undefined;
    }
  }

  private loadProfessionFields(): void {
    const parsed = parseStoredProfession(this.profile.profession);
    this.professionCategory = parsed.category;
    this.professionChoice = parsed.choice;
    this.professionOtherText = parsed.otherText;
    if (!this.profile.hafiz_quran && parsed.choice === 'Hafiz-e-Quran') {
      this.profile.hafiz_quran = 'Yes';
    }
  }

  private syncLanguageCategoriesFromSelection(): void {
    const pkSet = new Set<string>(this.pakistanLanguages);
    const intlSet = new Set<string>(this.internationalLanguages);
    this.showPakistanLanguages = this.selectedLanguages.some((l) => pkSet.has(l));
    this.showInternationalLanguages = this.selectedLanguages.some((l) => intlSet.has(l));
  }

  toggleLanguage(lang: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.selectedLanguages.includes(lang)) {
        this.selectedLanguages = [...this.selectedLanguages, lang];
      }
    } else {
      this.selectedLanguages = this.selectedLanguages.filter((l) => l !== lang);
    }
    this.formErrors.clear('languages');
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.message.set('Please select an image file');
      this.messageType.set('error');
      input.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      this.message.set('Image must be under 3 MB');
      this.messageType.set('error');
      input.value = '';
      return;
    }
    this.uploadingPhoto.set(true);
    this.profileService.uploadProfilePhoto(file).subscribe({
      next: (res) => {
        this.uploadingPhoto.set(false);
        this.profile.profile_photo = res.data.profile_photo;
        this.message.set('Photo uploaded — save profile to keep it');
        this.messageType.set('success');
        input.value = '';
      },
      error: (err) => {
        this.uploadingPhoto.set(false);
        this.message.set(err.error?.message || 'Photo upload failed');
        this.messageType.set('error');
        input.value = '';
      },
    });
  }

  removePhoto(): void {
    this.profile.profile_photo = undefined;
  }

  addContact(): void {
    this.contacts.push({ type: 'phone', number: '' });
  }

  removeContact(index: number): void {
    if (this.contacts.length > 1) {
      this.contacts.splice(index, 1);
    }
  }

  ngOnInit(): void {
    this.loadCustomDropdownOptions();
    const editId = this.route.snapshot.paramMap.get('id');
    const isNew = this.route.snapshot.routeConfig?.path === 'profile/new'
      || this.router.url.includes('/profile/new');

    if (isNew) {
      this.adminCreateMode.set(true);
      this.initEmptyAdminProfile();
      return;
    }
    if (editId) {
      this.adminEditId.set(editId);
      this.loadAdminProfile(editId);
      return;
    }
    this.loadMyProfile();
  }

  private loadCustomDropdownOptions(): void {
    this.dropdownService.getOptions().subscribe({
      next: (res) => {
        const map: Record<string, string[]> = {};
        for (const row of res.data || []) {
          const key = row.category
            ? `${row.field_key}::${row.category}`
            : row.field_key;
          if (!map[key]) map[key] = [];
          if (!map[key].includes(row.label)) map[key].push(row.label);
          if (!map[row.field_key]) map[row.field_key] = [];
          if (!map[row.field_key].includes(row.label)) map[row.field_key].push(row.label);
        }
        this.customOptions = map;
      },
    });
  }

  private mergeExtra(base: string[], fieldKey: string, category?: string): string[] {
    const extras = category
      ? (this.customOptions[`${fieldKey}::${category}`] || this.customOptions[fieldKey] || [])
      : (this.customOptions[fieldKey] || []);
    if (!extras.length) return base;
    const set = new Set(base);
    for (const item of extras) set.add(item);
    return [...set];
  }

  private initEmptyAdminProfile(): void {
    this.profile = {
      first_name: '',
      last_name: '',
      gender: undefined,
      country: 'Pakistan',
    };
    this.showPakistanResidence = true;
    this.showAbroadResidence = false;
    this.fullName = '';
    this.selectedLanguages = [];
    this.showPakistanLanguages = false;
    this.showInternationalLanguages = false;
    this.professionCategory = '';
    this.professionChoice = '';
    this.professionOtherText = '';
    this.reqProfessionCategory = '';
    this.reqProfessionChoice = '';
    this.reqProfessionOtherText = '';
    this.selectedReqCastes = [];
    this.selectedReqStates = [];
    this.selectedReqCities = [];
    this.selectedReqEducations = [];
    this.selectedReqProfessions = [];
    this.selectedReqCountries = [];
    this.pendingReqCaste = '';
    this.pendingReqState = '';
    this.pendingReqCity = '';
    this.pendingReqEducation = '';
    this.pendingReqCountry = '';
    this.pkHouseType = '';
    this.pkHouseLocation = '';
    this.abroadHouseType = '';
    this.abroadHouseLocation = '';
    this.accountEmail = '';
    this.contacts = [{ type: 'phone', number: '' }];
    this.requirements = {};
    this.heightFeet = null;
    this.heightInches = null;
    this.reqMinFeet = null;
    this.reqMinInches = null;
    this.reqMaxFeet = null;
    this.reqMaxInches = null;
    this.family = emptyFamilyDetails();
    this.loading.set(false);
  }

  private loadMyProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (res) => this.applyProfileData(res.data),
      error: () => this.loading.set(false),
    });
  }

  private loadAdminProfile(profileId: string): void {
    this.profileService.getById(profileId).subscribe({
      next: (res) => this.applyProfileData(res.data),
      error: () => {
        this.loading.set(false);
        this.message.set('Failed to load profile');
        this.messageType.set('error');
      },
    });
  }

  private applyProfileData(data: Profile): void {
    this.profile = data;
    this.fullName = joinFullName(data.first_name, data.last_name);
    this.accountEmail = data.user_email || data.email || this.authService.currentUser()?.email || '';
    this.selectedLanguages = parseLanguages(data.languages);
    this.syncLanguageCategoriesFromSelection();
    if (this.profile.date_of_birth) {
      this.profile.date_of_birth = this.profile.date_of_birth.split('T')[0];
    }
    if (!this.isAdminForm && !this.profile.religion) {
      this.profile.religion = 'Islam';
    }
    if (!this.profile.country) {
      this.profile.country = isOverseasProvince(this.profile.province) ? '' : 'Pakistan';
    }
    if (data.contacts?.length) {
      this.contacts = data.contacts.map((c) => ({
        id: c.id,
        type: c.type === 'whatsapp' ? 'whatsapp' : 'phone',
        number: c.number,
      }));
    } else {
      this.contacts = [{ type: 'phone', number: data.user_phone || '' }];
    }
    if (data.partner_preferences) {
      this.requirements = { ...this.requirements, ...data.partner_preferences };
    }
    this.loadReqMultiFields();
    this.onReligionChange(this.profile.religion || '');
    if (this.requirements.religion) {
      this.onReqReligionChange(this.requirements.religion);
    }
    this.loadHeightFields();
    this.loadDisabilityFields();
    this.loadProfessionFields();
    this.loadResidenceFields();
    this.family = parseFamilyDetails(data.family_details);
    this.loading.set(false);
  }

  private scrollToFirstError(field: string): void {
    setTimeout(() => {
      const invalid = document.querySelector('.input-invalid, .input-invalid-wrap') as HTMLElement | null;
      const named = document.querySelector(`[name="${field}"]`) as HTMLElement | null;
      const el = invalid || named;
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement
        ) {
          el.focus();
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  }

  save(): void {
    this.syncProfileHeight();
    this.syncReqMinHeight();
    this.syncReqMaxHeight();
    this.syncDisabilityField();
    this.syncProfessionField();
    this.syncResidenceToProfile();
    this.syncReqMultiToRequirements();
    this.profile.family_details = isFamilyDetailsEmpty(this.family)
      ? ''
      : serializeFamilyDetails(this.family);

    const names = splitFullName(this.fullName);
    this.profile.first_name = names.first_name;
    this.profile.last_name = names.last_name;
    this.profile.languages = this.selectedLanguages.length
      ? this.selectedLanguages.join(', ')
      : undefined;

    this.formErrors.markSubmitted();
    const formData = {
      full_name: this.fullName,
      first_name: names.first_name,
      last_name: names.last_name,
      email: this.accountEmail,
      gender: this.profile.gender,
      date_of_birth: this.profile.date_of_birth,
      height_cm: this.profile.height_cm,
      weight_kg: this.profile.weight_kg,
      marital_status: this.profile.marital_status,
      color: this.profile.color,
      guardian_type: this.profile.guardian_type,
      guardian_name: this.profile.guardian_name,
      disabilityChoice: this.disabilityChoice,
      religion: this.profile.religion,
      sect: this.profile.sect,
      city: this.profile.city,
      province: this.profile.province,
      country: this.profile.country,
      education: this.profile.education,
      profession: this.profile.profession,
      hafiz_quran: this.profile.hafiz_quran,
      caste: this.profile.caste,
      about_me: this.profile.about_me,
      family_details: this.profile.family_details,
      familyComplete: this.isAdminForm || isFamilyDetailsComplete(this.family),
      languages: this.selectedLanguages,
      showPakistanResidence: this.showPakistanResidence,
      showAbroadResidence: this.showAbroadResidence,
      abroad_country: this.profile.abroad_country,
      pkHouseType: this.pkHouseType,
      pkHouseLocation: this.pkHouseLocation,
      abroadHouseType: this.abroadHouseType,
      abroadHouseLocation: this.abroadHouseLocation,
      contacts: this.contacts,
      requirements: this.requirements,
      religionHasSects: this.availableSects.length > 0,
    };
    const errors = this.adminCreateMode()
      ? validateAdminCreateProfileForm(formData)
      : this.isAdminForm
        ? validateOptionalProfileForm(formData)
        : validateMyProfileForm(formData);
    this.formErrors.setAll(errors);
    if (Object.keys(errors).length) {
      this.message.set(firstError(errors) ?? 'Please fix the highlighted fields');
      this.messageType.set('error');
      this.scrollToFirstError(Object.keys(errors)[0]);
      return;
    }

    const validContacts = this.contacts.filter((c) => c.number.trim());
    this.saving.set(true);
    this.message.set('');

    const payload: Record<string, unknown> = {
      email: this.accountEmail.trim() || undefined,
      first_name: names.first_name || undefined,
      last_name: names.last_name || undefined,
      gender: this.profile.gender || undefined,
      date_of_birth: this.profile.date_of_birth || undefined,
      height_cm: this.profile.height_cm ?? undefined,
      weight_kg: this.profile.weight_kg ?? undefined,
      marital_status: this.profile.marital_status || undefined,
      religion: this.profile.religion || undefined,
      sect: this.profile.sect || undefined,
      caste: this.profile.caste || undefined,
      color: this.profile.color || undefined,
      house_own_location: this.profile.house_own_location || undefined,
      house_rent_location: this.profile.house_rent_location || undefined,
      abroad_country: this.profile.abroad_country || undefined,
      abroad_house_own_location: this.profile.abroad_house_own_location || undefined,
      abroad_house_rent_location: this.profile.abroad_house_rent_location || undefined,
      languages: this.profile.languages || undefined,
      guardian_type: this.profile.guardian_type || undefined,
      guardian_name: this.profile.guardian_name || undefined,
      profile_photo: this.profile.profile_photo || null,
      disability: this.profile.disability || undefined,
      city: this.profile.city || undefined,
      province: this.profile.province || undefined,
      education: this.profile.education || undefined,
      profession: this.profile.profession || undefined,
      hafiz_quran: this.profile.hafiz_quran || undefined,
      about_me: this.profile.about_me || undefined,
      looking_for: this.profile.looking_for || undefined,
      family_details: this.profile.family_details || undefined,
      visibility: this.profile.visibility || undefined,
      country: this.showPakistanResidence
        ? 'Pakistan'
        : (this.showAbroadResidence ? (this.profile.abroad_country || undefined) : undefined),
      contacts: validContacts,
      partner_preferences: {
        min_age: this.requirements.min_age ?? undefined,
        max_age: this.requirements.max_age ?? undefined,
        min_height_cm: this.requirements.min_height_cm ?? undefined,
        max_height_cm: this.requirements.max_height_cm ?? undefined,
        religion: this.requirements.religion || undefined,
        sect: this.requirements.sect || undefined,
        city: this.requirements.city || undefined,
        province: this.requirements.province || undefined,
        education: this.requirements.education || undefined,
        profession: this.requirements.profession || undefined,
        caste: this.requirements.caste || undefined,
        marital_status: this.requirements.marital_status || undefined,
        requirements_notes: this.requirements.requirements_notes || undefined,
        country: this.showReqOverseasCountries
          ? (this.requirements.country || undefined)
          : undefined,
      },
    };

    // Admin may clear optional fields to null so UI shows ---
    if (this.isAdminForm) {
      const optionalNullables: (keyof Profile)[] = [
        'marital_status', 'color', 'religion', 'sect', 'caste', 'languages', 'disability',
        'house_own_location', 'house_rent_location',
        'abroad_country', 'abroad_house_own_location', 'abroad_house_rent_location',
        'guardian_type', 'guardian_name',
        'profile_photo', 'weight_kg',
        'province', 'education', 'profession', 'hafiz_quran', 'about_me',
        'looking_for', 'family_details', 'height_cm',
      ];
      for (const key of optionalNullables) {
        const val = this.profile[key];
        if (val === '' || val === null || val === undefined) {
          payload[key] = null;
        }
      }
      if (!this.selectedLanguages.length) {
        payload['languages'] = null;
      }
      if (!this.profile.city?.trim()) {
        payload['city'] = '---';
      }
      if (!this.fullName.trim()) {
        payload['first_name'] = '---';
        payload['last_name'] = '---';
      }
      if (!this.profile.profession?.trim()) {
        payload['profession'] = null;
      }
      // Send nulls for empty partner preference fields
      const prefs = payload['partner_preferences'] as Record<string, unknown>;
      for (const key of Object.keys(prefs)) {
        if (prefs[key] === undefined) prefs[key] = null;
      }
    }

    const typedPayload = payload as Partial<Profile> & {
      email?: string;
      contacts: ProfileContact[];
      partner_preferences: PartnerPreferences;
    };

    const save$ = this.adminCreateMode()
      ? this.adminService.createProfile(typedPayload)
      : this.adminEditId()
        ? this.adminService.updateProfile(this.adminEditId()!, typedPayload)
        : this.profileService.updateMyProfile(typedPayload);

    save$.subscribe({
      next: (res) => {
        this.saving.set(false);
        this.formErrors.reset();
        this.message.set(this.adminCreateMode() ? 'Profile created successfully!' : 'Profile saved successfully!');
        this.messageType.set('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (res.data?.user_email) {
          this.accountEmail = res.data.user_email;
        }
        if (!this.isAdminForm) {
          this.authService.getMe().subscribe();
        }
        if (this.adminCreateMode() && res.data?.id) {
          setTimeout(() => this.router.navigate(['/profile', res.data.id]), 800);
        } else if (this.adminEditId()) {
          setTimeout(() => this.router.navigate(['/profile', this.adminEditId()]), 800);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.message.set(err.error?.message || 'Could not save profile. Please try again.');
        this.messageType.set('error');
        this.scrollToFirstError('full_name');
      },
    });
  }
}
