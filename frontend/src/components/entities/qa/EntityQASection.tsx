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
};

export default function EntityQASection({
  entityId,
  entityName,
  variant = 'public',
  focusQuestionId,
}: EntityQASectionProps) {
  const { user, loading: authLoading } = useAuth();
  const { activeBusiness } = useBusinessContext();

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
    <section className="rounded-xl bg-black p-6">
      <h2 className="text-2xl font-semibold text-white">
        Questions & Answers
      </h2>

      <p className="mt-1 text-sm text-gray-400">
        Ask questions about {entityName} and help other people learn
        more about this business.
      </p>

      {/* Hint: member কিন্তু personal profile থেকে দেখছে */}
      {canAnswer && !canReply && (
        <p className="mt-4 rounded-lg border border-gray-700 p-3 text-sm text-gray-300">
          To reply to questions, switch to {entityName}&apos;s
          profile from the account menu.
        </p>
      )}

      {/* Ask Question */}
      {showAskBox && (
      <div className="mt-6 rounded-lg border border-gray-700 p-5">
        <h3 className="font-semibold text-white">Have a question?</h3>

        <p className="mt-1 text-sm text-gray-400">
          Ask something about this business.
        </p>

        {!user ? (
          <p className="mt-4 text-sm text-gray-300">
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
              className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white placeholder-gray-500 focus:outline-none"
            />

            <div className="mt-1 text-right text-xs text-gray-500">
              {newQuestion.length}/{QUESTION_MAX_LENGTH}
            </div>

            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleAsk}
                disabled={asking || !newQuestion.trim()}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
              >
                {asking ? 'Posting...' : 'Post Question'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAskForm(false);
                  setNewQuestion('');
                }}
                className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAskForm(true)}
            className="mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200"
          >
            Ask a Question
          </button>
        )}
      </div>
      )}

      {/* List */}
      {loading ? (
        <p className="mt-6 text-sm text-gray-400">Loading...</p>
      ) : error ? (
        <p className="mt-6 text-sm text-red-400">{error}</p>
      ) : questions.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-700 p-10 text-center">
          <div className="text-3xl text-white">?</div>

          <h3 className="mt-3 font-semibold text-white">
            No questions yet
          </h3>

          <p className="mt-1 text-sm text-gray-400">
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
                className="rounded-lg border border-gray-700"
              >
                {/* Question row + arrow */}
                <button
                  type="button"
                  onClick={() => toggle(q.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start justify-between gap-4 p-4 text-left"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium text-white">
                      {q.question}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Asked by {q.asker.name} ·{' '}
                      {new Date(q.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`mt-1 h-5 w-5 shrink-0 text-gray-300 transition-transform ${
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
                  <div className="border-t border-gray-800 px-4 pb-4 pt-3">
                    {isAnswering ? (
                      <div>
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          maxLength={ANSWER_MAX_LENGTH}
                          rows={4}
                          placeholder="Write your answer..."
                          className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white placeholder-gray-500 focus:outline-none"
                        />

                        <div className="mt-1 text-right text-xs text-gray-500">
                          {answerText.length}/{ANSWER_MAX_LENGTH}
                        </div>

                        <div className="mt-3 flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveAnswer(q.id)}
                            disabled={
                              savingAnswer || !answerText.trim()
                            }
                            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
                          >
                            {savingAnswer ? 'Saving...' : 'Save Answer'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setAnsweringId(null)}
                            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {q.answer ? (
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Answer from {entityName}
                            </p>

                            <p className="whitespace-pre-wrap break-words text-sm text-gray-200">
                              {q.answer}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm italic text-gray-500">
                            No answer yet.
                          </p>
                        )}

                        {canReply && (
                          <button
                            type="button"
                            onClick={() => startAnswer(q)}
                            className="mt-3 rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
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
