'use client';
import { useState } from 'react';

// Generic inline-edit row. Both `display` and `edit` are plain ReactNodes (no
// functions — those can't cross the server→client boundary). We render the
// "edit" view when toggled on; it should be a <form> whose Save is a server
// action. A Cancel button is provided here to flip back without submitting.

export default function EditToggle({
  display, edit,
}: { display: React.ReactNode; edit: React.ReactNode }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">{display}</div>
        <button onClick={() => setEditing(true)}
          className="text-accent text-xs hover:underline shrink-0">edit</button>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {edit}
      <button onClick={() => setEditing(false)}
        className="text-muted text-xs hover:underline">cancel</button>
    </div>
  );
}
