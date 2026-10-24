import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BlogPost, getPostBySlug, getRelatedPosts } from '../../core/constants/blog-posts';
import { AdSlotComponent } from '../../shared/components/ad-slot/ad-slot';
import { ADSENSE_SLOTS } from '../../core/constants/adsense';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink, AdSlotComponent],
  template: `
    @if (post) {
      <article>
        <header class="article-hero" [style.background]="post.coverGradient">
          <div class="hero-overlay"></div>
          <div class="container hero-inner animate-fade-in-up">
            <a routerLink="/blog" class="back-link">← Back to Blog</a>
            <span class="article-category">{{ post.category }}</span>
            <h1>{{ post.title }}</h1>
            <div class="article-meta">
              <span>{{ post.author }}</span>
              <span>·</span>
              <span>{{ formatDate(post.publishedAt) }}</span>
              <span>·</span>
              <span>{{ post.readMinutes }} min read</span>
            </div>
          </div>
          <span class="hero-icon">{{ post.coverIcon }}</span>
        </header>

        <div class="container article-body">
          <div class="article-content card animate-fade-in-up delay-1">
            <p class="article-lead">{{ post.excerpt }}</p>
            @for (para of post.content; track $index) {
              <p class="article-para">{{ para }}</p>
              @if ($index === midAdIndex) {
                <div class="in-article-ad">
                  <app-ad-slot [slot]="adSlots.blogInArticle" format="horizontal" />
                </div>
              }
            }
          </div>

          <div class="article-footer animate-fade-in-up delay-2">
            <div class="share-cta card">
              <h3>Looking for a Blessed Rishta?</h3>
              <p>Create your free profile on Hum Rishta and connect with verified families.</p>
              <a routerLink="/register" class="btn btn-primary">Register Free</a>
            </div>
          </div>

          @if (related.length) {
            <section class="related-section animate-fade-in-up delay-3">
              <h2>Related Articles</h2>
              <div class="related-grid">
                @for (r of related; track r.slug) {
                  <a [routerLink]="['/blog', r.slug]" class="related-card card">
                    <div class="related-cover" [style.background]="r.coverGradient">
                      <span>{{ r.coverIcon }}</span>
                    </div>
                    <div class="related-body">
                      <span class="post-category">{{ r.category }}</span>
                      <h3>{{ r.title }}</h3>
                      <span class="read-time">{{ r.readMinutes }} min read</span>
                    </div>
                  </a>
                }
              </div>
            </section>
          }
        </div>
      </article>
    } @else {
      <div class="container not-found">
        <h1>Article Not Found</h1>
        <p>This blog post does not exist.</p>
        <a routerLink="/blog" class="btn btn-primary">Back to Blog</a>
      </div>
    }
  `,
  styles: [`
    .article-hero {
      position: relative;
      padding: 3.5rem 0 4rem;
      color: white;
      overflow: hidden;
      min-height: 320px;
      display: flex;
      align-items: flex-end;
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.5), transparent 60%);
    }
    .hero-icon {
      position: absolute;
      right: 8%;
      top: 50%;
      transform: translateY(-50%);
      font-size: 6rem;
      opacity: 0.25;
      pointer-events: none;
    }
    .hero-inner { position: relative; z-index: 1; max-width: 760px; }
    .back-link {
      display: inline-block;
      color: rgba(255,255,255,0.85);
      font-size: 0.88rem;
      margin-bottom: 1rem;
      text-decoration: none;
      transition: color 0.2s;
    }
    .back-link:hover { color: white; }
    .article-category {
      display: inline-block;
      padding: 0.3rem 0.85rem;
      background: rgba(255,255,255,0.2);
      border-radius: 50px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }
    .article-hero h1 {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 4vw, 2.5rem);
      line-height: 1.25;
      margin-bottom: 1rem;
      text-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
    .article-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      font-size: 0.88rem;
      opacity: 0.9;
    }

    .article-body { padding: 2.5rem 0 4rem; max-width: 800px; margin: 0 auto; }
    .article-content { padding: 2rem 2.25rem; margin-bottom: 2rem; }
    .article-lead {
      font-size: 1.1rem;
      font-weight: 500;
      color: var(--primary-dark);
      line-height: 1.75;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .article-para {
      font-size: 1rem;
      line-height: 1.85;
      color: var(--text);
      margin-bottom: 1.25rem;
    }
    .in-article-ad {
      margin: 1.75rem 0 2rem;
    }

    .share-cta {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, #fff8f3, white);
    }
    .share-cta h3 { font-family: var(--font-display); color: var(--primary-dark); margin-bottom: 0.5rem; }
    .share-cta p { color: var(--text-muted); margin-bottom: 1rem; }

    .related-section { margin-top: 3rem; }
    .related-section h2 {
      font-family: var(--font-display);
      font-size: 1.35rem;
      color: var(--primary-dark);
      margin-bottom: 1.25rem;
    }
    .related-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    .related-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      padding: 0;
      transition: var(--transition);
    }
    .related-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); color: inherit; }
    .related-cover {
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
    }
    .related-body { padding: 1rem 1.15rem; }
    .related-body h3 { font-size: 0.95rem; color: var(--primary-dark); margin: 0.35rem 0; line-height: 1.4; }
    .post-category { font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }
    .read-time { font-size: 0.75rem; color: var(--text-muted); }

    .not-found { text-align: center; padding: 4rem 0; }
    .not-found h1 { margin-bottom: 0.5rem; }
    .not-found p { color: var(--text-muted); margin-bottom: 1.5rem; }

    @media (max-width: 768px) {
      .related-grid { grid-template-columns: 1fr; }
      .article-content { padding: 1.5rem; }
      .hero-icon { display: none; }
    }
  `],
})
export class BlogDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  readonly adSlots = ADSENSE_SLOTS;
  post?: BlogPost;
  related: BlogPost[] = [];

  get midAdIndex(): number {
    const len = this.post?.content?.length ?? 0;
    if (len < 3) return -1;
    return Math.floor(len / 2) - 1;
  }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || '';
    this.post = getPostBySlug(slug);
    if (this.post) {
      this.related = getRelatedPosts(slug);
      this.seo.apply({
        title: this.post.title,
        description: this.post.metaDescription,
        path: `/blog/${this.post.slug}`,
        type: 'article',
      });
    } else {
      this.seo.apply({
        title: 'Article Not Found',
        description: 'The requested Hum Rishta blog article could not be found.',
        path: `/blog/${slug}`,
        noIndex: true,
      });
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' });
  }
}
