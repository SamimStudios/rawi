import React from 'react';
import { Routes, Route } from 'react-router-dom';
import JobsList from './JobsList';
import JobEditor from './JobEditor';

export default function JobRoutes() {
  return (
    <Routes>
      <Route index element={<JobsList />} />
      <Route path="edit/:id" element={<JobEditor />} />
    </Routes>
  );
}