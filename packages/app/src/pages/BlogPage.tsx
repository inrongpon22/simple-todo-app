import React from 'react';

// ── Domain models ────────────────────────────────────────────────────────────

class ArticleSection {
  readonly heading: string;
  readonly body: string;

  constructor(heading: string, body: string) {
    this.heading = heading;
    this.body = body;
  }

  renderLines(): { html: string; key: number }[] {
    return this.body.split('\n').map((line, i) => {
      const withBold = line.replace(/\*\*(.+?)\*\*/g, (_m, w: string) => `<b>${w}</b>`);
      const withCode = withBold.replace(
        /`(.+?)`/g,
        (_m, w: string) =>
          `<code class="bg-slate-100 px-1 rounded text-slate-700 font-mono text-xs">${w}</code>`,
      );
      return { html: withCode, key: i };
    });
  }
}

class Article {
  readonly slug: string;
  readonly title: string;
  readonly category: string;
  readonly summary: string;
  readonly sections: ArticleSection[];

  constructor(
    slug: string,
    title: string,
    category: string,
    summary: string,
    sections: ArticleSection[],
  ) {
    this.slug = slug;
    this.title = title;
    this.category = category;
    this.summary = summary;
    this.sections = sections;
  }

  static create(data: {
    slug: string;
    title: string;
    category: string;
    summary: string;
    sections: { heading: string; body: string }[];
  }): Article {
    return new Article(
      data.slug,
      data.title,
      data.category,
      data.summary,
      data.sections.map((s) => new ArticleSection(s.heading, s.body)),
    );
  }
}

// ── Data ─────────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Fundamentals: 'bg-blue-100 text-blue-700',
  Architecture: 'bg-violet-100 text-violet-700',
};

const ARTICLES: Article[] = [
  Article.create({
    slug: 'oop',
    title: 'Object-Oriented Programming',
    category: 'Fundamentals',
    summary:
      'OOP organises code around objects that bundle state and behaviour together, making large systems easier to model and extend.',
    sections: [
      {
        heading: 'The Four Pillars',
        body: `**Encapsulation** hides internal state behind a public interface so callers depend on behaviour, not implementation details.

**Abstraction** exposes only the essential characteristics of an object — a \`Shape\` knows how to \`draw()\` without callers caring whether it's a circle or square.

**Inheritance** lets a subclass reuse and specialise a parent class. Prefer composition over deep inheritance chains to avoid tight coupling.

**Polymorphism** allows the same interface to work across different concrete types — e.g., iterating a list of \`Animal\` objects and calling \`speak()\` on each without knowing the concrete type.`,
      },
      {
        heading: 'SOLID Principles',
        body: `**S** — Single Responsibility: a class has one reason to change.
**O** — Open/Closed: open for extension, closed for modification.
**L** — Liskov Substitution: subtypes must be usable in place of their parent.
**I** — Interface Segregation: many specific interfaces beat one general-purpose one.
**D** — Dependency Inversion: depend on abstractions, not concretions.`,
      },
      {
        heading: 'Key Takeaway',
        body: 'OOP shines when your problem domain maps naturally to discrete entities with clear responsibilities. Over-engineering with deep class hierarchies and excessive patterns is a common trap — keep classes small and focused.',
      },
    ],
  }),
  Article.create({
    slug: 'ddd',
    title: 'Domain-Driven Design',
    category: 'Architecture',
    summary:
      'DDD aligns software models with the business domain by using a shared language between developers and domain experts.',
    sections: [
      {
        heading: 'Ubiquitous Language',
        body: 'Developers and domain experts agree on a single vocabulary used in code, conversations, and documentation. When the code uses the same words as the business, misunderstandings surface quickly.',
      },
      {
        heading: 'Building Blocks',
        body: `**Entity** — an object with a unique identity that persists over time (e.g., \`Order\` identified by an order ID).

**Value Object** — immutable, identity-less; equality is based on attributes (e.g., \`Money(100, "USD")\`).

**Aggregate** — a cluster of entities and value objects with a single root that enforces consistency rules. All changes go through the Aggregate Root.

**Repository** — abstracts persistence, returning domain objects rather than raw rows.

**Domain Service** — stateless logic that doesn't belong to a single entity (e.g., a \`TransferService\` moving money between accounts).

**Domain Event** — a record that something meaningful happened in the domain (e.g., \`OrderPlaced\`, \`PaymentFailed\`).`,
      },
      {
        heading: 'Bounded Contexts',
        body: "Large systems are split into Bounded Contexts — each with its own model and ubiquitous language. A `Customer` in the `Billing` context has different attributes than `Customer` in `Support`. Context Maps describe how bounded contexts integrate.",
      },
      {
        heading: 'Key Takeaway',
        body: 'DDD pays off in complex business domains where the rules evolve. For a simple CRUD service it adds unnecessary overhead — apply it where the domain logic is genuinely intricate.',
      },
    ],
  }),
  Article.create({
    slug: 'edd',
    title: 'Event-Driven Design',
    category: 'Architecture',
    summary:
      'Event-driven systems communicate through asynchronous events, enabling loose coupling, high scalability, and audit trails.',
    sections: [
      {
        heading: 'Core Concepts',
        body: `**Event** — an immutable record of something that happened (e.g., \`todo.created\`). Events are named in past tense.

**Producer** — the service that emits an event after a state change.

**Consumer** — a service that subscribes to events and reacts (send an email, update a read model, trigger a workflow).

**Event Broker** — middleware (Kafka, RabbitMQ, AWS EventBridge) that routes events from producers to consumers, decoupling them in time and space.`,
      },
      {
        heading: 'Patterns',
        body: `**Event Notification** — the producer fires a lightweight event; consumers fetch details if needed.

**Event-Carried State Transfer** — the event payload contains all relevant state so consumers don't need to call back.

**Event Sourcing** — the canonical system state is derived by replaying all events, not by reading a snapshot table.

**CQRS (Command Query Responsibility Segregation)** — separates write models (commands) from read models (queries), often paired with event sourcing to build optimised projections.`,
      },
      {
        heading: 'This App as an Example',
        body: 'When a todo is created or deleted, the Express server publishes a `todo.created` / `todo.deleted` event to a Kafka topic. Any downstream service (analytics, notifications) can subscribe without modifying the core API. This is event notification at work.',
      },
      {
        heading: 'Key Takeaway',
        body: 'Event-driven architectures excel when services need to stay decoupled, when you need an audit log, or when workloads are bursty. The tradeoff is eventual consistency and increased operational complexity (managing brokers, dead-letter queues, schema evolution).',
      },
    ],
  }),
];

// ── Components ────────────────────────────────────────────────────────────────

interface ArticleCardProps {
  article: Article;
  onSelect: (slug: string) => void;
}

class ArticleCard extends React.Component<ArticleCardProps> {
  private _handleClick = (): void => {
    this.props.onSelect(this.props.article.slug);
  };

  render(): React.ReactNode {
    const { article } = this.props;
    const colorClass = CATEGORY_COLORS[article.category] ?? 'bg-slate-100 text-slate-600';

    return (
      <button
        type="button"
        onClick={this._handleClick}
        className="w-full text-left rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400 hover:shadow-md transition-all"
      >
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          {article.category}
        </span>
        <h2 className="mt-2 text-lg font-semibold text-slate-800">{article.title}</h2>
        <p className="mt-1 text-sm text-slate-500 leading-relaxed">{article.summary}</p>
        <span className="mt-3 inline-block text-sm font-medium text-slate-700 underline underline-offset-2">
          Read more →
        </span>
      </button>
    );
  }
}

interface ArticleDetailProps {
  article: Article;
  onBack: () => void;
}

class ArticleDetail extends React.Component<ArticleDetailProps> {
  render(): React.ReactNode {
    const { article, onBack } = this.props;
    const colorClass = CATEGORY_COLORS[article.category] ?? 'bg-slate-100 text-slate-600';

    return (
      <article className="rounded-xl bg-white p-6 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Back to articles
        </button>
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
          {article.category}
        </span>
        <h1 className="mt-2 text-2xl font-bold text-slate-800">{article.title}</h1>
        <p className="mt-2 text-slate-500 leading-relaxed border-l-4 border-slate-200 pl-4">
          {article.summary}
        </p>

        <div className="mt-6 space-y-6">
          {article.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-slate-700 mb-2">{section.heading}</h2>
              <div className="text-sm text-slate-600 leading-relaxed space-y-1">
                {section.renderLines().map(({ html, key }) => (
                  <p key={key} dangerouslySetInnerHTML={{ __html: html }} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    );
  }
}

interface BlogPageState {
  selectedSlug: string | null;
}

export class BlogPage extends React.Component<Record<string, never>, BlogPageState> {
  state: BlogPageState = { selectedSlug: null };

  private _handleSelect = (slug: string): void => {
    this.setState({ selectedSlug: slug });
  };

  private _handleBack = (): void => {
    this.setState({ selectedSlug: null });
  };

  render(): React.ReactNode {
    const article = ARTICLES.find((a) => a.slug === this.state.selectedSlug);

    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        {article ? (
          <ArticleDetail article={article} onBack={this._handleBack} />
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Learning Sessions</h1>
              <p className="mt-1 text-sm text-slate-500">
                Notes on software engineering concepts — OOP, DDD, Event-Driven Design, and more.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ARTICLES.map((a) => (
                <ArticleCard key={a.slug} article={a} onSelect={this._handleSelect} />
              ))}
            </div>
          </>
        )}
      </main>
    );
  }
}
