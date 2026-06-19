/*
Tujuan: Menyediakan skenario load testing k6 untuk simulasi ujian massal (500 concurrent users).
Caller: Tooling k6 CLI (k6 run k6-stress-test.js).
Dependensi: k6 load test runner.
Main Functions: Mensimulasikan alur autentikasi, pengambilan detail ujian, pembuatan sesi, submit jawaban, dan submit ujian.
*/

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 }, // Ramp-up ke 100 user
    { duration: '3m', target: 500 }, // Naikkan ke 500 user (peak load)
    { duration: '1m', target: 0 },   // Ramp-down ke 0
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // Kegagalan request harus < 1%
    http_req_duration: ['p(95)<500'], // 95% request harus selesai < 500ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000/api';

export default function () {
  // Skenario Ujian Massal:
  
  // 1. Simulasi Login Murid
  const payload = JSON.stringify({
    email: `student.test.${__VU}@zeniith.com`,
    password: 'password123',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const loginRes = http.post(`${BASE_URL}/auth/login`, payload, params);
  
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'has token': (r) => r.json().data.accessToken !== undefined,
  });

  if (!loginSuccess) {
    sleep(1);
    return;
  }

  const token = loginRes.json().data.accessToken;
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  sleep(1);

  // 2. Lihat Daftar Ujian Tersedia
  const examsRes = http.get(`${BASE_URL}/exams`, authParams);
  check(examsRes, {
    'get exams status is 200': (r) => r.status === 200,
    'has exam items': (r) => Array.isArray(r.json().data),
  });

  const exams = examsRes.json().data;
  if (exams.length === 0) {
    sleep(1);
    return;
  }

  const examId = exams[0].id;
  sleep(1);

  // 3. Memulai Sesi Ujian Baru
  const sessionRes = http.post(`${BASE_URL}/exams/${examId}/sessions`, null, authParams);
  const sessionCreated = check(sessionRes, {
    'start exam status is 200': (r) => r.status === 200,
    'has session id': (r) => r.json().data.id !== undefined,
  });

  if (!sessionCreated) {
    sleep(1);
    return;
  }

  const sessionId = sessionRes.json().data.id;
  sleep(1);

  // 4. Simulasi Submit Jawaban (Kirim beberapa jawaban secara berurutan)
  const questionId = 'dummy-question-uuid'; // Diubah sesuai ID question real
  const answerPayload = JSON.stringify({
    questionId: questionId,
    selectedOptionId: 'dummy-option-uuid',
    answerText: 'Ini jawaban simulasi load test k6',
    isMarkedDoubt: false,
  });

  const answerRes = http.post(`${BASE_URL}/sessions/${sessionId}/answers`, answerPayload, authParams);
  check(answerRes, {
    'submit answer status is 200': (r) => r.status === 200,
  });

  sleep(2);

  // 5. Submit Akhir Ujian (Menyelesaikan Sesi)
  const submitRes = http.post(`${BASE_URL}/sessions/${sessionId}/submit`, null, authParams);
  check(submitRes, {
    'submit exam final status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
