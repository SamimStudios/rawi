import React from 'react';
import { Routes, Route } from 'react-router-dom';
import FieldList from './FieldList';
import FieldBuilder from '../FieldBuilder';

export default function FieldRoutes() {
  return (
    <Routes>
      <Route index element={<FieldList />} />
      <Route path="new" element={<FieldBuilder />} />
      <Route path=":id" element={<FieldBuilder />} />
    </Routes>
  );
}