import {
  alertsScenarios,
  briefingFailureResponse,
  briefingScenarios,
  storiesScenarios,
  tickersScenarios
} from '@situation-monitor/mock-data';
import { useEffect, useRef, useState } from 'react';

import { useDashboardData } from './data/useDashboardData.js';
import { BriefingPanel } from './sections/briefing-panel/BriefingPanel.js';
import { StoryFeed } from './sections/story-feed/StoryFeed.js';
import { TickerWatchlistPanel } from './sections/ticker-watchlist-panel/TickerWatchlistPanel.js';
import { Timeline } from './sections/timeline/Timeline.js';
import { TopBar } from './sections/top-bar/TopBar.js';

type LayoutPreset = 'command' | 'market-focus' | 'news-focus';
type WidgetId = 'stories' | 'briefing' | 'tickers' | 'alerts' | 'market-pulse' | 'scenario-inspector';
type InteractionType = 'drag' | 'resize';
type ResizeEdge = 'top' | 'right' | 'bottom' | 'left';

type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type InteractionState = {
  id: WidgetId;
  type: InteractionType;
  edge?: ResizeEdge;
  startClientX: number;
  startClientY: number;
  initial: WidgetLayout;
};

type ContextMenuState = {
  clientX: number;
  clientY: number;
  gridX: number;
  gridY: number;
  targetWidgetId: WidgetId | null;
};

const GRID_COLUMNS = 12;
const GRID_ROWS = 10;
const MIN_WIDGET_WIDTH = 2;
const MIN_WIDGET_HEIGHT = 2;
const widgetIds: WidgetId[] = ['stories', 'briefing', 'tickers', 'alerts', 'market-pulse', 'scenario-inspector'];

const presetLayouts: Record<LayoutPreset, Record<WidgetId, WidgetLayout>> = {
  command: {
    stories: { x: 0, y: 0, w: 6, h: 6 },
    briefing: { x: 6, y: 0, w: 6, h: 3 },
    tickers: { x: 6, y: 3, w: 3, h: 3 },
    alerts: { x: 9, y: 3, w: 3, h: 3 },
    'market-pulse': { x: 6, y: 6, w: 3, h: 4 },
    'scenario-inspector': { x: 9, y: 6, w: 3, h: 4 }
  },
  'market-focus': {
    stories: { x: 8, y: 3, w: 4, h: 4 },
    briefing: { x: 8, y: 0, w: 4, h: 3 },
    tickers: { x: 0, y: 0, w: 8, h: 6 },
    alerts: { x: 0, y: 6, w: 4, h: 4 },
    'market-pulse': { x: 4, y: 6, w: 4, h: 4 },
    'scenario-inspector': { x: 8, y: 7, w: 4, h: 3 }
  },
  'news-focus': {
    stories: { x: 0, y: 0, w: 8, h: 5 },
    briefing: { x: 8, y: 0, w: 4, h: 3 },
    tickers: { x: 0, y: 5, w: 4, h: 5 },
    alerts: { x: 8, y: 3, w: 4, h: 4 },
    'market-pulse': { x: 4, y: 5, w: 4, h: 5 },
    'scenario-inspector': { x: 8, y: 7, w: 4, h: 3 }
  }
};

const widgetLabels: Record<WidgetId, string> = {
  stories: 'Story Feed',
  briefing: 'AI Briefing',
  tickers: 'Ticker + Watchlist',
  alerts: 'Alerts Timeline',
  'market-pulse': 'Market Pulse',
  'scenario-inspector': 'Scenario Inspector'
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isOverlapping(a: WidgetLayout, b: WidgetLayout): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function shrinkToAvoidOverlap(active: WidgetLayout, target: WidgetLayout): WidgetLayout {
  const targetRight = target.x + target.w;
  const targetBottom = target.y + target.h;

  const candidates: WidgetLayout[] = [];
  const leftWidth = active.x - target.x;
  if (leftWidth >= MIN_WIDGET_WIDTH) {
    candidates.push({ ...target, w: leftWidth });
  }

  const rightX = active.x + active.w;
  const rightWidth = targetRight - rightX;
  if (rightWidth >= MIN_WIDGET_WIDTH) {
    candidates.push({ ...target, x: rightX, w: rightWidth });
  }

  const topHeight = active.y - target.y;
  if (topHeight >= MIN_WIDGET_HEIGHT) {
    candidates.push({ ...target, h: topHeight });
  }

  const bottomY = active.y + active.h;
  const bottomHeight = targetBottom - bottomY;
  if (bottomHeight >= MIN_WIDGET_HEIGHT) {
    candidates.push({ ...target, y: bottomY, h: bottomHeight });
  }

  if (candidates.length === 0) {
    return target;
  }

  return candidates.reduce((best, candidate) => {
    const bestArea = best.w * best.h;
    const candidateArea = candidate.w * candidate.h;
    return candidateArea > bestArea ? candidate : best;
  });
}

function resolveOverlaps(
  nextLayout: Record<WidgetId, WidgetLayout>,
  activeId: WidgetId,
  visible: Record<WidgetId, boolean>
): Record<WidgetId, WidgetLayout> {
  const resolved = { ...nextLayout };
  const active = resolved[activeId];

  for (const widgetId of widgetIds) {
    if (widgetId === activeId || !visible[widgetId]) {
      continue;
    }

    const other = resolved[widgetId];
    if (isOverlapping(active, other)) {
      resolved[widgetId] = shrinkToAvoidOverlap(active, other);
    }
  }

  return resolved;
}

export function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [preset, setPreset] = useState<LayoutPreset>('command');
  const [layout, setLayout] = useState<Record<WidgetId, WidgetLayout>>(presetLayouts.command);
  const [visible, setVisible] = useState<Record<WidgetId, boolean>>({
    stories: true,
    briefing: true,
    tickers: true,
    alerts: true,
    'market-pulse': false,
    'scenario-inspector': false
  });
  const [interaction, setInteraction] = useState<InteractionState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dashboardData = useDashboardData();

  const visibleWidgetCount = Object.values(visible).filter(Boolean).length;
  const hiddenWidgetIds = widgetIds.filter((widgetId) => !visible[widgetId]);

  function getGridPosition(clientX: number, clientY: number): { x: number; y: number } {
    const gridBounds = gridRef.current?.getBoundingClientRect();

    if (!gridBounds) {
      return { x: 0, y: 0 };
    }

    const colWidth = gridBounds.width / GRID_COLUMNS;
    const rowHeight = gridBounds.height / GRID_ROWS;
    const x = clamp(Math.floor((clientX - gridBounds.left) / colWidth), 0, GRID_COLUMNS - MIN_WIDGET_WIDTH);
    const y = clamp(Math.floor((clientY - gridBounds.top) / rowHeight), 0, GRID_ROWS - MIN_WIDGET_HEIGHT);
    return { x, y };
  }

  function openGridContextMenu(clientX: number, clientY: number) {
    const position = getGridPosition(clientX, clientY);
    setContextMenu({
      clientX,
      clientY,
      gridX: position.x,
      gridY: position.y,
      targetWidgetId: null
    });
  }

  function openWidgetContextMenu(widgetId: WidgetId, clientX: number, clientY: number) {
    const position = getGridPosition(clientX, clientY);
    setContextMenu({
      clientX,
      clientY,
      gridX: position.x,
      gridY: position.y,
      targetWidgetId: widgetId
    });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function deleteWidget(widgetId: WidgetId) {
    setVisible((previous) => ({ ...previous, [widgetId]: false }));
    closeContextMenu();
  }

  function addWidget(widgetId: WidgetId) {
    const menu = contextMenu;
    if (!menu) {
      return;
    }

    setLayout((previous) => {
      const base = previous[widgetId] ?? presetLayouts[preset][widgetId];
      return {
        ...previous,
        [widgetId]: {
          ...base,
          x: clamp(menu.gridX, 0, GRID_COLUMNS - base.w),
          y: clamp(menu.gridY, 0, GRID_ROWS - base.h)
        }
      };
    });

    setVisible((previous) => ({ ...previous, [widgetId]: true }));
    closeContextMenu();
  }

  function replaceWidget(targetWidgetId: WidgetId, nextWidgetId: WidgetId) {
    if (targetWidgetId === nextWidgetId) {
      closeContextMenu();
      return;
    }

    setLayout((previous) => {
      const nextLayout = { ...previous };
      const targetLayout = nextLayout[targetWidgetId];

      if (visible[nextWidgetId]) {
        const replacementLayout = nextLayout[nextWidgetId];
        nextLayout[nextWidgetId] = targetLayout;
        nextLayout[targetWidgetId] = replacementLayout;
        return nextLayout;
      }

      nextLayout[nextWidgetId] = { ...targetLayout };
      return nextLayout;
    });

    setVisible((previous) => ({
      ...previous,
      [targetWidgetId]: false,
      [nextWidgetId]: true
    }));

    closeContextMenu();
  }

  function activatePreset(nextPreset: LayoutPreset) {
    setPreset(nextPreset);
    setLayout(presetLayouts[nextPreset]);
    closeContextMenu();
  }

  function beginInteraction(
    id: WidgetId,
    type: InteractionType,
    clientX: number,
    clientY: number,
    edge?: ResizeEdge
  ) {
    const nextInteraction: InteractionState = {
      id,
      type,
      startClientX: clientX,
      startClientY: clientY,
      initial: layout[id]
    };

    if (type === 'resize' && edge) {
      nextInteraction.edge = edge;
    }

    setInteraction(nextInteraction);
    closeContextMenu();
  }

  useEffect(() => {
    if (!interaction) {
      return;
    }

    const activeInteraction = interaction;

    function onPointerMove(event: PointerEvent) {
      const gridBounds = gridRef.current?.getBoundingClientRect();

      if (!gridBounds) {
        return;
      }

      const colWidth = gridBounds.width / GRID_COLUMNS;
      const rowHeight = gridBounds.height / GRID_ROWS;

      const deltaColumns = Math.round((event.clientX - activeInteraction.startClientX) / colWidth);
      const deltaRows = Math.round((event.clientY - activeInteraction.startClientY) / rowHeight);

      setLayout((previous) => {
        const current = previous[activeInteraction.id];

        if (!current) {
          return previous;
        }

        let nextActive = current;

        if (activeInteraction.type === 'drag') {
          const nextX = clamp(activeInteraction.initial.x + deltaColumns, 0, GRID_COLUMNS - current.w);
          const nextY = clamp(activeInteraction.initial.y + deltaRows, 0, GRID_ROWS - current.h);

          nextActive = {
            ...current,
            x: nextX,
            y: nextY
          };
        } else if (activeInteraction.edge === 'right') {
          const nextW = clamp(
            activeInteraction.initial.w + deltaColumns,
            MIN_WIDGET_WIDTH,
            GRID_COLUMNS - activeInteraction.initial.x
          );

          nextActive = {
            ...current,
            w: nextW
          };
        } else if (activeInteraction.edge === 'left') {
          const maxLeftX = activeInteraction.initial.x + activeInteraction.initial.w - MIN_WIDGET_WIDTH;
          const nextX = clamp(activeInteraction.initial.x + deltaColumns, 0, maxLeftX);
          const nextW = activeInteraction.initial.w - (nextX - activeInteraction.initial.x);

          nextActive = {
            ...current,
            x: nextX,
            w: nextW
          };
        } else if (activeInteraction.edge === 'bottom') {
          const nextH = clamp(
            activeInteraction.initial.h + deltaRows,
            MIN_WIDGET_HEIGHT,
            GRID_ROWS - activeInteraction.initial.y
          );

          nextActive = {
            ...current,
            h: nextH
          };
        } else if (activeInteraction.edge === 'top') {
          const maxTopY = activeInteraction.initial.y + activeInteraction.initial.h - MIN_WIDGET_HEIGHT;
          const nextY = clamp(activeInteraction.initial.y + deltaRows, 0, maxTopY);
          const nextH = activeInteraction.initial.h - (nextY - activeInteraction.initial.y);

          nextActive = {
            ...current,
            y: nextY,
            h: nextH
          };
        }

        const nextLayout = {
          ...previous,
          [activeInteraction.id]: nextActive
        };

        return resolveOverlaps(nextLayout, activeInteraction.id, visible);
      });
    }

    function onPointerUp() {
      setInteraction(null);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [interaction, visible]);

  useEffect(() => {
    function onDismissContextMenu() {
      closeContextMenu();
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeContextMenu();
      }
    }

    window.addEventListener('click', onDismissContextMenu);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('click', onDismissContextMenu);
      window.removeEventListener('keydown', onEscape);
    };
  }, []);

  function renderWidget(widgetId: WidgetId) {
    if (widgetId === 'stories') {
      return (
        <StoryFeed
          title="Story Feed"
          response={dashboardData.stories.response}
          emptyResponse={storiesScenarios.empty}
          staleResponse={storiesScenarios.stale}
          sourceLabel={dashboardData.stories.status.label}
          sourceDetail={dashboardData.stories.status.detail}
          isFallback={dashboardData.stories.status.isFallback}
        />
      );
    }

    if (widgetId === 'briefing') {
      return (
        <BriefingPanel
          title="Briefing"
          readyResponse={dashboardData.briefing.response}
          unavailableResponse={briefingScenarios.unavailable}
          failedResponse={briefingFailureResponse}
          sourceLabel={dashboardData.briefing.status.label}
          sourceDetail={dashboardData.briefing.status.detail}
          isFallback={dashboardData.briefing.status.isFallback}
        />
      );
    }

    if (widgetId === 'tickers') {
      return (
        <TickerWatchlistPanel
          title="Ticker + Watchlist"
          response={dashboardData.tickers.response}
          partialResponse={tickersScenarios.partial}
          missingResponse={tickersScenarios.missingFields}
          sourceLabel={dashboardData.tickers.status.label}
          sourceDetail={dashboardData.tickers.status.detail}
          isFallback={dashboardData.tickers.status.isFallback}
        />
      );
    }

    if (widgetId === 'market-pulse') {
      const snapshot = dashboardData.tickers.response.data.snapshots[0];
      const alertCount = dashboardData.alerts.response.data.alerts.length;

      return (
        <section className="panel">
          <h2>Market Pulse</h2>
          <p className="subtle">Compact market condition widget</p>
          <p className="subtle panel__status">Source: {dashboardData.overallSourceLabel}</p>
          <div className="meta-grid">
            <div>
              <span className="subtle">Lead Symbol</span>
              <p>{snapshot?.symbol ?? 'n/a'}</p>
            </div>
            <div>
              <span className="subtle">24h Change</span>
              <p>{snapshot?.changePercent24h ?? 0}%</p>
            </div>
            <div>
              <span className="subtle">Alerts In Queue</span>
              <p>{alertCount}</p>
            </div>
          </div>
        </section>
      );
    }

    if (widgetId === 'scenario-inspector') {
      return (
        <section className="panel">
          <h2>Scenario Inspector</h2>
          <p className="subtle">Mock runtime scenario quick switch reference</p>
          <p className="subtle panel__status">Endpoint base: {dashboardData.baseUrl}</p>
          <ul>
            <li>
              <strong>Briefing:</strong> ready | unavailable | failed
            </li>
            <li>
              <strong>Stories:</strong> default | empty | stale | conflicting
            </li>
            <li>
              <strong>Tickers:</strong> default | partial | missingFields
            </li>
            <li>
              <strong>Current source:</strong> {dashboardData.overallSourceLabel}
            </li>
          </ul>
        </section>
      );
    }

    return (
      <Timeline
        title="Timeline / Alerts"
        response={dashboardData.alerts.response}
        emptyResponse={alertsScenarios.empty}
        sourceLabel={dashboardData.alerts.status.label}
        sourceDetail={dashboardData.alerts.status.detail}
        isFallback={dashboardData.alerts.status.isFallback}
      />
    );
  }

  return (
    <div className="layout" data-theme={theme}>
      <TopBar
        fallbackCount={dashboardData.fallbackCount}
        generatedAt={dashboardData.generatedAt}
        isDarkMode={theme === 'dark'}
        onToggleTheme={() => setTheme((previous) => (previous === 'dark' ? 'light' : 'dark'))}
        refreshLabel={dashboardData.refreshLabel}
        sourceLabel={dashboardData.overallSourceLabel}
      />

      <section className="panel controls">
        <div className="controls__group">
          <span className="controls__label">Layout Preset</span>
          <div className="controls__buttons">
            <button
              type="button"
              className={preset === 'command' ? 'is-active' : ''}
              onClick={() => activatePreset('command')}
            >
              Command
            </button>
            <button
              type="button"
              className={preset === 'market-focus' ? 'is-active' : ''}
              onClick={() => activatePreset('market-focus')}
            >
              Market Focus
            </button>
            <button
              type="button"
              className={preset === 'news-focus' ? 'is-active' : ''}
              onClick={() => activatePreset('news-focus')}
            >
              News Focus
            </button>
          </div>
        </div>

        <div className="controls__group">
          <span className="controls__label">Widgets Active ({visibleWidgetCount}/6)</span>
          <p className="subtle">Right-click blank space to add widgets. Right-click widget to delete or replace.</p>
        </div>
      </section>

      <div
        ref={gridRef}
        className={`grid ${interaction ? 'is-interacting' : ''}`}
        onContextMenu={(event) => {
          event.preventDefault();
          openGridContextMenu(event.clientX, event.clientY);
        }}
      >
        {widgetIds
          .filter((widgetId) => visible[widgetId])
          .map((widgetId) => {
            const widgetLayout = layout[widgetId];

            return (
              <article
                key={widgetId}
                className="widget-frame"
                style={{
                  left: `${(widgetLayout.x / GRID_COLUMNS) * 100}%`,
                  top: `${(widgetLayout.y / GRID_ROWS) * 100}%`,
                  width: `${(widgetLayout.w / GRID_COLUMNS) * 100}%`,
                  height: `${(widgetLayout.h / GRID_ROWS) * 100}%`
                }}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openWidgetContextMenu(widgetId, event.clientX, event.clientY);
                }}
              >
                <header
                  className="widget-frame__header"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    beginInteraction(widgetId, 'drag', event.clientX, event.clientY);
                  }}
                >
                  <span>{widgetLabels[widgetId]}</span>
                  <small>Drag</small>
                </header>

                <div className="widget-frame__body">{renderWidget(widgetId)}</div>

                <button
                  type="button"
                  className="widget-frame__resize widget-frame__resize--top"
                  aria-label={`Resize ${widgetLabels[widgetId]} from top`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    beginInteraction(widgetId, 'resize', event.clientX, event.clientY, 'top');
                  }}
                />
                <button
                  type="button"
                  className="widget-frame__resize widget-frame__resize--right"
                  aria-label={`Resize ${widgetLabels[widgetId]} from right`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    beginInteraction(widgetId, 'resize', event.clientX, event.clientY, 'right');
                  }}
                />
                <button
                  type="button"
                  className="widget-frame__resize widget-frame__resize--bottom"
                  aria-label={`Resize ${widgetLabels[widgetId]} from bottom`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    beginInteraction(widgetId, 'resize', event.clientX, event.clientY, 'bottom');
                  }}
                />
                <button
                  type="button"
                  className="widget-frame__resize widget-frame__resize--left"
                  aria-label={`Resize ${widgetLabels[widgetId]} from left`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    beginInteraction(widgetId, 'resize', event.clientX, event.clientY, 'left');
                  }}
                />
              </article>
            );
          })}

        {contextMenu ? (
          <div
            className="context-menu"
            style={{
              left: contextMenu.clientX,
              top: contextMenu.clientY
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {contextMenu.targetWidgetId ? (
              <>
                <button
                  type="button"
                  className="context-menu__item context-menu__danger"
                  onClick={() => deleteWidget(contextMenu.targetWidgetId!)}
                >
                  Delete {widgetLabels[contextMenu.targetWidgetId]}
                </button>
                <span className="context-menu__label">Replace With</span>
                {widgetIds
                  .filter((widgetId) => widgetId !== contextMenu.targetWidgetId)
                  .map((widgetId) => (
                    <button
                      key={widgetId}
                      type="button"
                      className="context-menu__item"
                      onClick={() => replaceWidget(contextMenu.targetWidgetId!, widgetId)}
                    >
                      {widgetLabels[widgetId]}
                    </button>
                  ))}
              </>
            ) : (
              <>
                <span className="context-menu__label">Add Widget</span>
                {hiddenWidgetIds.length === 0 ? (
                  <p className="subtle">All widgets are already active.</p>
                ) : (
                  hiddenWidgetIds.map((widgetId) => (
                    <button
                      key={widgetId}
                      type="button"
                      className="context-menu__item"
                      onClick={() => addWidget(widgetId)}
                    >
                      {widgetLabels[widgetId]}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        ) : null}
      </div>

      {visibleWidgetCount === 0 ? (
        <section className="panel empty-state">
          <h2>No widgets selected</h2>
          <p>Use the widget toggles above to compose your dashboard view.</p>
        </section>
      ) : null}
    </div>
  );
}
