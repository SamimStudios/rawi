import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TemplateList from './TemplateList';
import TemplateBuilder from './TemplateBuilder';

export default function TemplateRoutes() {
  return (
    <Routes>
      <Route index element={<TemplateList />} />
      <Route path="new" element={<TemplateBuilder />} />
      <Route path=":id" element={<TemplateBuilder />} />
    </Routes>
  );
}