import React from 'react';
import { Routes, Route } from 'react-router-dom';
import JobEditor from './JobEditor';

export default function JobRoutes() {
  return (
    <Routes>
      <Route path="edit/:id" element={<JobEditor />} />
    </Routes>
  );
}