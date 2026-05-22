import React from 'react';
import { NavLink } from 'react-router-dom';

export class Navbar extends React.Component {
  private _linkClass = ({ isActive }: { isActive: boolean }): string =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`;

  render(): React.ReactNode {
    return (
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <span className="text-base font-bold text-slate-800 mr-4">DevNotes</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={this._linkClass}>
              Todos
            </NavLink>
            <NavLink to="/workout" className={this._linkClass}>
              Workout
            </NavLink>
            <NavLink to="/blog" className={this._linkClass}>
              Blog
            </NavLink>
          </nav>
        </div>
      </header>
    );
  }
}
