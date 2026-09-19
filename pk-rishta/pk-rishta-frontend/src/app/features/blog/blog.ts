import { Component, OnInit, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { BLOG_POSTS } from '../../core/constants/blog-posts';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';

@Component({
  selector: 'app-blog',
  imports: [RouterLink, AdSlotComponent],
  template: `
    <section class="blog-hero bg-page-header">
      <div class="hero-glow"></div>
      <div class="hero-sparkles">
        @for (s of sparkles; track s) {
          <span class="sparkle" [class]="'s' + s">✦</span>
        }
      </div>
      <div class="container hero-inner">
        <div class="hero-badge animate-fade-in-up">
          <span class="pulse-dot"></span> Match & Marriage Insights
        </div>
        <h1 class="animate-fade-in-up delay-1">Hum Rishta <span class="gold">Blog</span></h1>
        <p class="text-urdu animate-fade-in-up delay-2">شادی اور رشتہ کی رہنمائی</p>
        <p class="hero-sub animate-fade-in-up delay-3">
          Expert guides on finding halal matches, marriage preparation, safety, and Pakistani family traditions.
        </p>
      </div>
    </section>

    <div class="container blog-body">
      @if (featured) {
        <a [routerLink]="['/blog', featured.slug]" class="featured-card animate-fade-in-up delay-1">
          <div class="featured-cover" [style.background]="featured.coverGradient">
            <span class="featured-icon">{{ featured.coverIcon }}</span>
            <span class="featured-tag">Featured</span>
          </div>
          <div class="featured-content">
            <span class="post-category">{{ featured.category }}</span>
            <h2>{{ featured.title }}</h2>
            <p>{{ featured.excerpt }}</p>
            <div class="post-meta">
              <span>{{ formatDate(featured.publishedAt) }}</span>
              <span>·</span>
              <span>{{ featured.readMinutes }} min read</span>
            </div>
            <span class="read-more">Read article →</span>
          </div>
        </a>
      }

      <div class="posts-grid">
        @for (post of restPosts; track post.slug; let i = $index) {
          <a
            [routerLink]="['/blog', post.slug]"
            class="post-card card animate-fade-in-up"
            [class]="'delay-' + ((i % 5) + 1)"
          >
            <div class="post-cover" [style.background]="post.coverGradient">
              <span class="post-icon">{{ post.coverIcon }}</span>
            </div>
            <div class="post-body">
              <span class="post-category">{{ post.category }}</span>
              <h3>{{ post.title }}</h3>
              <p>{{ post.excerpt }}</p>
              <div class="post-meta">
                <span>{{ formatDate(post.publishedAt) }}</span>
                <span>{{ post.readMinutes }} min</span>
              </div>
            </div>
          </a>
        }
      </div>

      <div class="blog-ad">
        <app-ad-slot [slot]="adSlots.blogSidebar" format="horizontal" />
      </div>

      <div class="blog-cta card animate-fade-in-up delay-3">
        <h3>Ready to Find Your Match?</h3>
        <p>Join thousands of families on Pakistan's trusted matrimonial platform.</p>
        <div class="cta-btns">
          <a routerLink="/register" class="btn btn-primary">Register Free</a>
          <a routerLink="/search" class="btn btn-outline">Browse Profiles</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .blog-hero {
      position: relative;
      padding: 4rem 0 3.5rem;
      overflow: hidden;
      text-align: center;
    }
    .hero-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(201, 162, 39, 0.15), transparent 65%);
      pointer-events: none;
    }
    .hero-sparkles {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .sparkle {
      position: absolute;
      color: var(--gold-shine);
      opacity: 0.5;
      animation: sparkle 3s ease-in-out infinite;
    }
    .s1 { top: 15%; left: 10%; font-size: 1.2rem; animation-delay: 0s; }
    .s2 { top: 25%; right: 12%; font-size: 0.9rem; animation-delay: 0.8s; }
    .s3 { bottom: 30%; left: 18%; font-size: 1rem; animation-delay: 1.5s; }
    .s4 { top: 40%; right: 22%; font-size: 1.1rem; animation-delay: 0.4s; }
    .s5 { bottom: 20%; right: 8%; font-size: 0.85rem; animation-delay: 2s; }
    .hero-inner { position: relative; z-index: 1; }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.25);
      border-radius: 50px;
      font-size: 0.82rem;
      font-weight: 600;
      color: white;
      margin-bottom: 1rem;
    }
    .pulse-dot {
      width: 8px; height: 8px;
      background: var(--gold);
      border-radius: 50%;
      animation: pulse-ring 2s ease infinite;
    }
    .blog-hero h1 {
      font-family: var(--font-display);
      font-size: clamp(2rem, 5vw, 3rem);
      color: white;
      margin-bottom: 0.5rem;
    }
    .gold { color: var(--gold-shine); }
    .hero-sub {
      color: rgba(255,255,255,0.88);
      max-width: 560px;
      margin: 1rem auto 0;
      font-size: 1rem;
      line-height: 1.7;
    }

    .blog-body { padding: 2.5rem 0 4rem; }
    .blog-ad { max-width: 728px; margin: 0 auto 2rem; }
    .featured-card {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 0;
      background: white;
      border-radius: var(--radius-lg);
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      box-shadow: var(--shadow-lg);
      margin-bottom: 2.5rem;
      transition: var(--transition);
      border: 1px solid var(--border);
    }
    .featured-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 50px rgba(155, 27, 48, 0.15);
      color: inherit;
    }
    .featured-cover {
      min-height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .featured-icon { font-size: 4rem; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2)); }
    .featured-tag {
      position: absolute;
      top: 1rem;
      left: 1rem;
      padding: 0.3rem 0.85rem;
      background: rgba(255,255,255,0.9);
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
    }
    .featured-content { padding: 2rem 2.25rem; display: flex; flex-direction: column; justify-content: center; }
    .featured-content h2 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      margin: 0.5rem 0 0.75rem;
      color: var(--primary-dark);
      line-height: 1.35;
    }
    .featured-content p { color: var(--text-muted); line-height: 1.7; margin-bottom: 1rem; }
    .read-more { color: var(--primary); font-weight: 700; font-size: 0.9rem; margin-top: auto; }

    .posts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    .post-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      padding: 0;
      transition: var(--transition);
    }
    .post-card:hover {
      transform: translateY(-5px);
      box-shadow: var(--shadow-lg);
      color: inherit;
    }
    .post-cover {
      height: 160px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .post-icon { font-size: 2.5rem; }
    .post-body { padding: 1.25rem 1.35rem 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .post-category {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 0.4rem;
    }
    .post-body h3 {
      font-size: 1.05rem;
      font-family: var(--font-display);
      color: var(--primary-dark);
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }
    .post-body p {
      font-size: 0.88rem;
      color: var(--text-muted);
      line-height: 1.6;
      flex: 1;
      margin-bottom: 0.75rem;
    }
    .post-meta {
      display: flex;
      gap: 0.5rem;
      font-size: 0.78rem;
      color: var(--text-light);
    }

    .blog-cta {
      text-align: center;
      padding: 2.5rem;
      background: linear-gradient(135deg, #fff8f3, #fff);
    }
    .blog-cta h3 { font-family: var(--font-display); font-size: 1.5rem; color: var(--primary-dark); margin-bottom: 0.5rem; }
    .blog-cta p { color: var(--text-muted); margin-bottom: 1.25rem; }
    .cta-btns { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

    @media (max-width: 992px) {
      .posts-grid { grid-template-columns: repeat(2, 1fr); }
      .featured-card { grid-template-columns: 1fr; }
      .featured-cover { min-height: 200px; }
    }
    @media (max-width: 576px) {
      .posts-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class BlogComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  readonly adSlots = ADSENSE_SLOTS;
  readonly posts = BLOG_POSTS;
  readonly featured = BLOG_POSTS[0];
  readonly restPosts = BLOG_POSTS.slice(1);
  readonly sparkles = [1, 2, 3, 4, 5];

  ngOnInit(): void {
    this.title.setTitle('Blog — Match & Marriage Guides | Hum Rishta');
    this.meta.updateTag({
      name: 'description',
      content: 'Read expert articles on finding a match in Pakistan, marriage tips, profile advice, safety, and family traditions.',
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
