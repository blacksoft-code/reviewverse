'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';
import {
  ANSWER_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  EntityQuestion,
  answerQuestion,
  askQuestion,
  getEntityQuestions,
} from '@/services/entity-question.service';

type EntityQASectionProps = {
  entityId: string;
  entityName: string;
  // 'public'  → entity-র public page (user হিসেবে প্রশ্ন করা যায়)
  // 'manage'  → entity profile-এর Q&A tab (শুধু reply, প্রশ্ন করার form নেই)
  variant?: 'public' | 'manage';
  // Notification link থেকে এলে ঐ প্রশ্নটাই খোলা থাকবে
  focusQuestionId?: string;
  // 'dark' = public page (আগের মতো), 'light' = Apple-style business dashboard
  theme?: 'dark' | 'light';
};

// Theme অনুযায়ী class-গুলো এক জায়গায় — কাঠামো/লজিক একই থাকে
const THEMES = {
  dark: {
    section: 'rounded-xl bg-black p-6',
    title: 'text-2xl font-semibold text-white',
    sub: 'mt-1 text-sm text-gray-400',
    hint: 'mt-4 rounded-lg border border-gray-700 p-3 text-sm text-gray-300',
    askBox: 'mt-6 rounded-lg border border-gray-700 p-5',
    askTitle: 'font-semibold text-white',
    askSub: 'mt-1 text-sm text-gray-400',
    loginText: 'mt-4 text-sm text-gray-300',
    textarea:
      'w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white placeholder-gray-500 focus:outline-none',
    counter: 'mt-1 text-right text-xs text-gray-500',
    primary:
      'rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50',
    primarySm:
      'rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50',
    secondary:
      'rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900',
    secondarySm:
      'rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900',
    muted: 'mt-6 text-sm text-gray-400',
    error: 'mt-6 text-sm text-red-400',
    emptyBox:
      'mt-6 rounded-lg border border-dashed border-gray-700 p-10 text-center',
    emptyIcon: 'text-3xl text-white',
    emptyTitle: 'mt-3 font-semibold text-white',
    emptySub: 'mt-1 text-sm text-gray-400',
    item: 'rounded-lg border border-gray-700',
    qText: 'break-words font-medium text-white',
    meta: 'mt-1 text-xs text-gray-500',
    chevron: 'mt-1 h-5 w-5 shrink-0 text-gray-300 transition-transform',
    divider: 'border-t border-gray-800 px-4 pb-4 pt-3',
    answerLabel:
      'mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500',
    answerText: 'whitespace-pre-wrap break-words text-sm text-gray-200',
    noAnswer: 'text-sm italic text-gray-500',
  },
  light: {
    section: '',
    title: 'text-[28px] font-semibold tracking-tight text-[#1d1d1f]',
    sub: 'mt-1 text-[15px] text-[#6e6e73]',
    hint: 'mt-4 rounded-2xl bg-[#f5f5f7] p-4 text-sm text-[#6e6e73]',
    askBox: 'mt-6 rounded-2xl bg-[#f5f5f7] p-5',
    askTitle: 'font-semibold text-[#1d1d1f]',
    askSub: 'mt-1 text-sm text-[#6e6e73]',
    loginText: 'mt-4 text-sm text-[#6e6e73]',
    textarea:
      'w-full rounded-xl border border-[#d2d2d7] bg-white p-3 text-sm text-[#1d1d1f] placeholder-[#86868b] outline-none focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15',
    counter: 'mt-1 text-right text-xs text-[#86868b]',
    primary:
      'rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50',
    primarySm:
      'rounded-full bg-[#0071e3] px-4 py-2 text-sm font-medium text-white hover:bg-[#0077ed] disabled:opacity-50',
    secondary:
      'rounded-full bg-[#e8e8ed] px-5 py-2.5 text-sm font-medium text-[#1d1d1f] hover:bg-[#dcdce1]',
    secondarySm:
      'rounded-full bg-[#e8e8ed] px-4 py-2 text-sm font-medium text-[#1d1d1f] hover:bg-[#dcdce1]',
    muted: 'mt-6 text-sm text-[#6e6e73]',
    error: 'mt-6 text-sm text-[#d70015]',
    emptyBox: 'mt-6 rounded-2xl bg-[#f5f5f7] p-10 text-center',
    emptyIcon: 'text-3xl text-[#86868b]',
    emptyTitle: 'mt-3 font-semibold text-[#1d1d1f]',
    emptySub: 'mt-1 text-sm text-[#6e6e73]',
    item: 'rounded-2xl bg-[#f5f5f7]',
    qText: 'break-words font-medium text-[#1d1d1f]',
    meta: 'mt-1 text-xs text-[#86868b]',
    chevron: 'mt-1 h-5 w-5 shrink-0 text-[#86868b] transition-transform',
    divider: 'border-t border-black/5 px-4 pb-4 pt-3',
    answerLabel:
      'mb-1 text-xs font-semibold uppercase tracking-wide text-[#86868b]',
    answerText: 'whitespace-pre-wrap break-words text-sm text-[#1d1d1f]',
    noAnswer: 'text-sm italic text-[#86868b]',
  },
} as const;

export default function EntityQASection({
  entityId,
  entityName,
  variant = 'public',
  focusQuestionId,
  theme = 'dark',
}: EntityQASectionProps) {
  const { user, loading: authLoading } = useAuth();
  const { activeBusiness } = useBusinessContext();
  const t = THEMES[theme];

  const [questions, setQuestions] = useState<EntityQuestion[]>([]);
  const [canAnswer, setCanAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // শুরুতে শুধু প্রথম প্রশ্নের উত্তর খোলা থাকবে
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  // Ask form
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [asking, setAsking] = useState(false);

  // Answer form (একসাথে একটাই edit হবে)
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [savingAnswer, setSavingAnswer] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);

      const response = await getEntityQuestions(entityId);
      const list = response.data;

      setQuestions(list);
      setCanAnswer(response.meta?.canAnswer ?? false);

      // initial state: প্রথম প্রশ্ন open — তবে notification থেকে এলে
      // ঐ নির্দিষ্ট প্রশ্নটা open
      const focused = focusQuestionId
        ? list.find((q) => q.id === focusQuestionId)
        : undefined;

      const initial = focused ?? list[0];
      setOpenIds(new Set(initial ? [initial.id] : []));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load questions',
      );
    } finally {
      setLoading(false);
    }
  }, [entityId, focusQuestionId]);

  // login/logout হলে canAnswer নতুন করে আনতে হবে
  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, user?.id, load]);

  // Reply শুধু তখনই যখন এই entity-র profile (entity mode) থেকে দেখা হচ্ছে।
  // Owner নিজের personal profile থেকে এলে reply দিতে পারবে না।
  const canReply = canAnswer && activeBusiness?.id === entityId;

  // Asking একটা personal কাজ — entity mode-এ বা manage tab-এ দেখানো হয় না
  const showAskBox = variant === 'public' && !activeBusiness;

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  async function handleAsk() {
    const text = newQuestion.trim();
    if (!text) return;

    try {
      setAsking(true);

      const response = await askQuestion(entityId, text);

      // নতুন প্রশ্ন উপরে যোগ হবে, আগের open/close state অপরিবর্তিত
      setQuestions((prev) => [response.data, ...prev]);
      setNewQuestion('');
      setShowAskForm(false);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      setAsking(false);
    }
  }

  function startAnswer(q: EntityQuestion) {
    setAnsweringId(q.id);
    setAnswerText(q.answer ?? '');
  }

  async function handleSaveAnswer(questionId: string) {
    const text = answerText.trim();
    if (!text) return;

    try {
      setSavingAnswer(true);

      const response = await answerQuestion(questionId, text);

      setQuestions((prev) =>
        prev.map((q) => (q.id === questionId ? response.data : q)),
      );
      setAnsweringId(null);
      setAnswerText('');
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Something went wrong',
      );
    } finally {
      setSavingAnswer(false);
    }
  }

  return (
    <section className={t.section}>
      <h2 className={t.title}>
        Questions & Answers
      </h2>

      <p className={t.sub}>
        Ask questions about {entityName} and help other people learn
        more about this business.
      </p>

      {/* Hint: member কিন্তু personal profile থেকে দেখছে */}
      {canAnswer && !canReply && (
        <p className={t.hint}>
          To reply to questions, switch to {entityName}&apos;s
          profile from the account menu.
        </p>
      )}

      {/* Ask Question */}
      {showAskBox && (
      <div className={t.askBox}>
        <h3 className={t.askTitle}>Have a question?</h3>

        <p className={t.askSub}>
          Ask something about this business.
        </p>

        {!user ? (
          <p className={t.loginText}>
            Please{' '}
            <Link href="/login" className="underline">
              log in
            </Link>{' '}
            to ask a question.
          </p>
        ) : showAskForm ? (
          <div className="mt-4">
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              maxLength={QUESTION_MAX_LENGTH}
              rows={3}
              placeholder="Type your question..."
              className={t.textarea}
            />

            <div className={t.counter}>
              {newQuestion.length}/{QUESTION_MAX_LENGTH}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleAsk}
                disabled={asking || !newQuestion.trim()}
                className={t.primary}
              >
                {asking ? 'Posting...' : 'Post Question'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAskForm(false);
                  setNewQuestion('');
                }}
                className={t.secondary}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAskForm(true)}
            className={`mt-4 ${t.primary}`}
          >
            Ask a Question
          </button>
        )}
      </div>
      )}

      {/* List */}
      {loading ? (
        <p className={t.muted}>Loading...</p>
      ) : error ? (
        <p className={t.error}>{error}</p>
      ) : questions.length === 0 ? (
        <div className={t.emptyBox}>
          <div className={t.emptyIcon}>?</div>

          <h3 className={t.emptyTitle}>
            No questions yet
          </h3>

          <p className={t.emptySub}>
            Be the first person to ask a question about this business.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {questions.map((q) => {
            const isOpen = openIds.has(q.id);
            const isAnswering = answeringId === q.id;

            return (
              <li
                key={q.id}
                className={t.item}
              >
                {/* Question row + arrow */}
                <button
                  type="button"
                  onClick={() => toggle(q.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-4 p-4 text-left"
                >
                  <div className="min-w-0">
                    <p className={t.qText}>
                      {q.question}
                    </p>

                    <p className={t.meta}>
                      Asked by {q.asker.name} ·{' '}
                      {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`${t.chevron} ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Answer */}
                {isOpen && (
                  <div className={t.divider}>
                    {isAnswering ? (
                      <div>
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          maxLength={ANSWER_MAX_LENGTH}
                          rows={4}
                          placeholder="Write your answer..."
                          className={t.textarea}
                        />

                        <div className={t.counter}>
                          {answerText.length}/{ANSWER_MAX_LENGTH}
                        </div>

                        <div className="mt-3 flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveAnswer(q.id)}
                            disabled={
                              savingAnswer || !answerText.trim()
                            }
                            className={t.primarySm}
                          >
                            {savingAnswer ? 'Saving...' : 'Save Answer'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setAnsweringId(null)}
                            className={t.secondarySm}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {q.answer ? (
                          <div>
                            <p className={t.answerLabel}>
                              Answer from {entityName}
                            </p>

                            <p className={t.answerText}>
                              {q.answer}
                            </p>
                          </div>
                        ) : (
                          <p className={t.noAnswer}>
                            No answer yet.
                          </p>
                        )}

                        {canReply && (
                          <button
                            type="button"
                            onClick={() => startAnswer(q)}
                            className={`mt-3 ${t.secondarySm}`}
                          >
                            {q.answer ? 'Edit Answer' : 'Reply'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
