import memoizeOne from 'memoize-one';
import { createElement, PureComponent, SyntheticEvent } from 'react';
import { getScrollBarInfo } from '../util';
import { cancelTimeout, requestTimeout, TimeoutID } from './common';
import { getRTLOffsetType } from './domHelpers';
import { flushSync } from 'react-dom';

type Direction = 'ltr' | 'rtl';
export type ScrollToAlign = 'auto' | 'smart' | 'center' | 'start' | 'end';

type itemSize = number | ((index: number) => number);

type ScrollDirection = 'forward' | 'backward';

type OnItemsRenderedCallback = ({
  overscanColumnStartIndex,
  overscanColumnStopIndex,
  overscanRowStartIndex,
  overscanRowStopIndex,
  visibleColumnStartIndex,
  visibleColumnStopIndex,
  visibleRowStartIndex,
  visibleRowStopIndex
}: {
  [key: string]: number;
}) => void;

type ScrollEvent = SyntheticEvent<HTMLDivElement>;

export type Props<T> = {
  children: any;
  className?: string;
  columnCount: number;
  columnWidth: itemSize;
  direction: Direction;
  height: number;
  initialScrollLeft?: number;
  initialScrollTop?: number;
  innerRef?: any;
  innerElementType?: any;
  innerTagName?: string; // deprecated
  itemData: T;
  itemKey?: (params: { columnIndex: number; data: T; rowIndex: number }) => any;
  onItemsRendered?: OnItemsRenderedCallback;
  onScroll?: (...args) => void;
  outerRef?: any;
  outerElementType?: any;
  outerTagName?: string; // deprecated
  overscanColumnCount?: number;
  overscanColumnsCount?: number; // deprecated
  overscanCount?: number; // deprecated
  overscanRowCount?: number;
  overscanRowsCount?: number; // deprecated
  rowCount: number;
  rowHeight: itemSize;
  style?: Object;
  useIsScrolling: boolean;
  width: number;
};

type State = {
  instance: any;
  isScrolling: boolean;
  horizontalScrollDirection: ScrollDirection;
  scrollLeft: number;
  scrollTop: number;
  scrollUpdateWasRequested: boolean;
  verticalScrollDirection: ScrollDirection;
};

const IS_SCROLLING_DEBOUNCE_INTERVAL = 150;

const defaultItemKey = ({ columnIndex, rowIndex }) => `${rowIndex}:${columnIndex}`;

// In DEV mode, this Set helps us only log a warning once per component instance.
// This avoids spamming the console every time a render happens.
let devWarningsOverscanCount: any = null;
let devWarningsOverscanRowsColumnsCount: any = null;
let devWarningsTagName: any = null;
if (process.env.NODE_ENV !== 'production') {
  if (typeof window !== 'undefined' && typeof window.WeakSet !== 'undefined') {
    devWarningsOverscanCount = new WeakSet();
    devWarningsOverscanRowsColumnsCount = new WeakSet();
    devWarningsTagName = new WeakSet();
  }
}

export default function createGridComponent({
  getColumnOffset,
  getColumnStartIndexForOffset,
  getColumnStopIndexForStartIndex,
  getColumnWidth,
  getEstimatedTotalHeight,
  getEstimatedTotalWidth,
  getOffsetForColumnAndAlignment,
  getOffsetForRowAndAlignment,
  getRowHeight,
  getRowOffset,
  getRowStartIndexForOffset,
  getRowStopIndexForStartIndex,
  initInstanceProps,
  shouldResetStyleCacheOnItemSizeChange
}) {
  return class Grid<T> extends PureComponent<Props<T>, State> {
    _instanceProps: any = initInstanceProps(this.props, this);
    _resetIsScrollingTimeoutId: TimeoutID | null = null;
    _outerRef: any;
    _isTree: boolean = false;
    _shouldResetStyleCacheOnItemSizeChange: boolean = shouldResetStyleCacheOnItemSizeChange;

    static defaultProps = {
      direction: 'ltr',
      itemData: undefined,
      useIsScrolling: false
    };

    state: State = {
      instance: this,
      isScrolling: false,
      horizontalScrollDirection: 'forward',
      scrollLeft: typeof this.props.initialScrollLeft === 'number' ? this.props.initialScrollLeft : 0,
      scrollTop: typeof this.props.initialScrollTop === 'number' ? this.props.initialScrollTop : 0,
      scrollUpdateWasRequested: false,
      verticalScrollDirection: 'forward'
    };

    // Always use explicit constructor for React components.
    // It produces less code after transpilation. (#26)
    // eslint-disable-next-line no-useless-constructor
    constructor(props: Props<T>) {
      super(props);
      //  this._shouldResetStyleCacheOnItemSizeChange = (props.itemData as any)?.table?.shouldResetStyleCacheOnItemSizeChange?.();
    }

    scrollTo({ scrollLeft, scrollTop }: { scrollLeft: number; scrollTop: number }): void {
      if (scrollLeft !== undefined) {
        scrollLeft = Math.max(0, scrollLeft);
      }
      if (scrollTop !== undefined) {
        scrollTop = Math.max(0, scrollTop);
      }

      this.setState((prevState) => {
        if (scrollLeft === undefined) {
          scrollLeft = prevState.scrollLeft;
        }
        if (scrollTop === undefined) {
          scrollTop = prevState.scrollTop;
        }

        if (prevState.scrollLeft === scrollLeft && prevState.scrollTop === scrollTop) {
          return null;
        }

        return {
          horizontalScrollDirection: prevState.scrollLeft < scrollLeft ? 'forward' : 'backward',
          scrollLeft: scrollLeft,
          scrollTop: scrollTop,
          scrollUpdateWasRequested: true,
          verticalScrollDirection: prevState.scrollTop < scrollTop ? 'forward' : 'backward'
        };
      }, this._resetIsScrollingDebounced);
    }

    scrollLeftAndTop({ left = 0, top = 0 }, callback?) {
      const { scrollHeight, scrollWidth, clientHeight, clientWidth } = this._outerRef;
      const [maxScrollLeft, maxScrollTop] = [scrollWidth - clientWidth, scrollHeight - clientHeight];

      this.setState(
        (prevState) => {
          let [scrollLeft, scrollTop] = [
            Math.min(prevState.scrollLeft + left, maxScrollLeft),
            Math.min(prevState.scrollTop + top, maxScrollTop)
          ];
          if (prevState.scrollLeft === scrollLeft && prevState.scrollTop === scrollTop) {
            return null;
          }

          if (maxScrollTop === scrollTop) {
            scrollTop = 0;
          }
          if (maxScrollLeft === scrollLeft) {
            scrollLeft = 0;
          }

          return {
            horizontalScrollDirection: prevState.scrollLeft < scrollLeft ? 'forward' : 'backward',
            scrollLeft: scrollLeft,
            scrollTop: scrollTop,
            scrollUpdateWasRequested: true,
            verticalScrollDirection: prevState.scrollTop < scrollTop ? 'forward' : 'backward'
          };
        },
        () => {
          this._resetIsScrollingDebounced();
          const { scrollLeft, scrollTop } = this.state;
          callback?.({ left: scrollLeft === maxScrollLeft, top: maxScrollTop === scrollTop });
        }
      );
    }

    scrollToItem({
      align = 'auto',
      columnIndex,
      rowIndex
    }: {
      align: ScrollToAlign;
      columnIndex?: number;
      rowIndex?: number;
    }): void {
      const { columnCount, height, rowCount, width } = this.props;
      const { scrollLeft, scrollTop } = this.state;
      const scrollbarSize = getScrollBarInfo();

      if (columnIndex !== undefined) {
        columnIndex = Math.max(0, Math.min(columnIndex, columnCount - 1));
      }
      if (rowIndex !== undefined) {
        rowIndex = Math.max(0, Math.min(rowIndex, rowCount - 1));
      }

      const estimatedTotalHeight = getEstimatedTotalHeight(this.props, this._instanceProps);
      const estimatedTotalWidth = getEstimatedTotalWidth(this.props, this._instanceProps);

      // The scrollbar size should be considered when scrolling an item into view,
      // to ensure it's fully visible.
      // But we only need to account for its size when it's actually visible.
      const horizontalScrollbarSize = estimatedTotalWidth > width ? scrollbarSize.width : 0;
      const verticalScrollbarSize = estimatedTotalHeight > height ? scrollbarSize.height : 0;

      this.scrollTo({
        scrollLeft:
          columnIndex !== undefined
            ? getOffsetForColumnAndAlignment(
              this.props,
              columnIndex,
              align,
              scrollLeft,
              this._instanceProps,
              verticalScrollbarSize
            )
            : scrollLeft,
        scrollTop:
          rowIndex !== undefined
            ? getOffsetForRowAndAlignment(
              this.props,
              rowIndex,
              align,
              scrollTop,
              this._instanceProps,
              horizontalScrollbarSize
            )
            : scrollTop
      });
    }

    componentDidMount() {
      const { initialScrollLeft, initialScrollTop } = this.props;

      if (this._outerRef != null) {
        const outerRef = this._outerRef;
        if (typeof initialScrollLeft === 'number') {
          outerRef.scrollLeft = initialScrollLeft;
        }
        if (typeof initialScrollTop === 'number') {
          outerRef.scrollTop = initialScrollTop;
        }
      }

      this._callPropsCallbacks();
    }

    componentDidUpdate() {
      const { direction } = this.props;
      const { scrollLeft, scrollTop, scrollUpdateWasRequested } = this.state;

      if (scrollUpdateWasRequested && this._outerRef != null) {
        // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
        // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
        // So we need to determine which browser behavior we're dealing with, and mimic it.
        const outerRef = this._outerRef;
        if (direction === 'rtl') {
          switch (getRTLOffsetType()) {
            case 'negative':
              outerRef.scrollLeft = -scrollLeft;
              break;
            case 'positive-ascending':
              outerRef.scrollLeft = scrollLeft;
              break;
            default:
              const { clientWidth, scrollWidth } = outerRef;
              outerRef.scrollLeft = scrollWidth - clientWidth - scrollLeft;
              break;
          }
        } else {
          outerRef.scrollLeft = Math.max(0, scrollLeft);
        }

        outerRef.scrollTop = Math.max(0, scrollTop);
      }

      this._callPropsCallbacks();
    }

    componentWillUnmount() {
      if (this._resetIsScrollingTimeoutId !== null) {
        cancelTimeout(this._resetIsScrollingTimeoutId);
      }
    }

    render() {
      const {
        children,
        className,
        columnCount,
        direction,
        height,
        innerRef,
        innerElementType,
        innerTagName,
        itemData,
        itemKey = defaultItemKey,
        outerElementType,
        outerTagName,
        rowCount,
        style,
        useIsScrolling,
        width
      } = this.props;
      const { isScrolling } = this.state;

      const [columnStartIndex, columnStopIndex] = this._getHorizontalRangeToRender();
      const [rowStartIndex, rowStopIndex] = this._getVerticalRangeToRender();

      const items: any = [];
      if (columnCount > 0 && rowCount) {
        for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
          for (let columnIndex = columnStartIndex; columnIndex <= columnStopIndex; columnIndex++) {
            items.push(
              createElement(children, {
                columnIndex,
                data: itemData,
                isScrolling: useIsScrolling ? isScrolling : undefined,
                key: itemKey({ columnIndex, data: itemData, rowIndex }),
                rowIndex,
                style: this._getItemStyle(rowIndex, columnIndex)
              })
            );
          }
        }
      }

      // Read this value AFTER items have been created,
      // So their actual sizes (if variable) are taken into consideration.
      const estimatedTotalHeight = getEstimatedTotalHeight(this.props, this._instanceProps);
      const estimatedTotalWidth = getEstimatedTotalWidth(this.props, this._instanceProps);

      return createElement(
        outerElementType || outerTagName || 'div',
        {
          className,
          onScroll: this._onScroll,
          ref: this._outerRefSetter,
          style: {
            position: 'relative',
            height,
            width,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            willChange: 'transform',
            direction,
            ...style
          }
        },
        createElement(innerElementType || innerTagName || 'div', {
          children: items,
          ref: innerRef,
          style: {
            height: estimatedTotalHeight,
            pointerEvents: isScrolling ? 'none' : undefined,
            width: estimatedTotalWidth
          }
        })
      );
    }

    _onScroll = (event: ScrollEvent): void => {
      const { clientHeight, clientWidth, scrollLeft, scrollTop, scrollHeight, scrollWidth } = event.currentTarget;
      const scrollAsync = (this.props.itemData as any)?.table?.props.optimize?.scrollAsync;
      const wrap = scrollAsync ? ((fn) => fn()) : flushSync;  // 强制同步，防止header区域滚动延迟（react18）
      wrap(() => this.setState((prevState) => {
        if (prevState.scrollLeft === scrollLeft && prevState.scrollTop === scrollTop) {
          // Scroll position may have been updated by cDM/cDU,
          // In which case we don't need to trigger another render,
          // And we don't want to update state.isScrolling.
          return null;
        }

        const { direction } = this.props;

        // TRICKY According to the spec, scrollLeft should be negative for RTL aligned elements.
        // This is not the case for all browsers though (e.g. Chrome reports values as positive, measured relative to the left).
        // It's also easier for this component if we convert offsets to the same format as they would be in for ltr.
        // So the simplest solution is to determine which browser behavior we're dealing with, and convert based on it.
        let calculatedScrollLeft = scrollLeft;
        if (direction === 'rtl') {
          switch (getRTLOffsetType()) {
            case 'negative':
              calculatedScrollLeft = -scrollLeft;
              break;
            case 'positive-descending':
              calculatedScrollLeft = scrollWidth - clientWidth - scrollLeft;
              break;
          }
        }

        // Prevent Safari's elastic scrolling from causing visual shaking when scrolling past bounds.
        calculatedScrollLeft = Math.max(0, Math.min(calculatedScrollLeft, scrollWidth - clientWidth));
        const calculatedScrollTop = Math.max(0, Math.min(scrollTop, scrollHeight - clientHeight));

        return {
          isScrolling: true,
          horizontalScrollDirection: prevState.scrollLeft < scrollLeft ? 'forward' : 'backward',
          scrollLeft: calculatedScrollLeft,
          scrollTop: calculatedScrollTop,
          verticalScrollDirection: prevState.scrollTop < scrollTop ? 'forward' : 'backward',
          scrollUpdateWasRequested: false
        };
      }, this._resetIsScrollingDebounced));
    };

    _outerRefSetter = (ref: any): void => {
      const { outerRef } = this.props;

      this._outerRef = ref as HTMLDivElement;

      if (typeof outerRef === 'function') {
        outerRef(ref);
      } else if (outerRef != null && typeof outerRef === 'object' && outerRef.hasOwnProperty('current')) {
        outerRef.current = ref;
      }
    };

    _getHorizontalRangeToRender() {
      const { columnCount, overscanColumnCount, overscanColumnsCount, overscanCount, rowCount } = this.props;
      const { scrollLeft } = this.state;

      const overscanCountResolved: number = overscanColumnCount || overscanColumnsCount || overscanCount || 1;

      if (columnCount === 0 || rowCount === 0) {
        return [0, 0, 0, 0];
      }

      const startIndex = getColumnStartIndexForOffset(this.props, scrollLeft, this._instanceProps);
      const stopIndex = getColumnStopIndexForStartIndex(this.props, startIndex, scrollLeft, this._instanceProps);

      return [
        Math.max(0, startIndex - overscanCountResolved),
        Math.max(0, Math.min(columnCount - 1, stopIndex + overscanCountResolved)),
        startIndex,
        stopIndex
      ];
    }

    _getVerticalRangeToRender(): [number, number, number, number] {
      const { columnCount, overscanCount, overscanRowCount, overscanRowsCount, rowCount } = this.props;
      const { scrollTop } = this.state;

      const overscanCountResolved: number = overscanRowCount || overscanRowsCount || overscanCount || 1;

      if (columnCount === 0 || rowCount === 0) {
        return [0, 0, 0, 0];
      }

      const startIndex = getRowStartIndexForOffset(this.props, scrollTop, this._instanceProps);
      const stopIndex = getRowStopIndexForStartIndex(this.props, startIndex, scrollTop, this._instanceProps);

      return [
        Math.max(0, startIndex - overscanCountResolved),
        Math.max(0, Math.min(rowCount - 1, stopIndex + overscanCountResolved)),
        startIndex,
        stopIndex
      ];
    }

    _callOnItemsRendered = memoizeOne(
      (
        overscanColumnStartIndex: number,
        overscanColumnStopIndex: number,
        overscanRowStartIndex: number,
        overscanRowStopIndex: number,
        visibleColumnStartIndex: number,
        visibleColumnStopIndex: number,
        visibleRowStartIndex: number,
        visibleRowStopIndex: number
      ) =>
        this.props.onItemsRendered?.({
          overscanColumnStartIndex,
          overscanColumnStopIndex,
          overscanRowStartIndex,
          overscanRowStopIndex,
          visibleColumnStartIndex,
          visibleColumnStopIndex,
          visibleRowStartIndex,
          visibleRowStopIndex
        })
    );

    _callOnScroll = memoizeOne(
      (
        scrollLeft: number,
        scrollTop: number,
        horizontalScrollDirection: ScrollDirection,
        verticalScrollDirection: ScrollDirection,
        scrollUpdateWasRequested: boolean
      ) =>
        this.props.onScroll?.({
          horizontalScrollDirection,
          scrollLeft,
          scrollTop,
          verticalScrollDirection,
          scrollUpdateWasRequested
        })
    );

    _callPropsCallbacks() {
      const { columnCount, onItemsRendered, onScroll, rowCount } = this.props;

      if (typeof onItemsRendered === 'function') {
        if (columnCount > 0 && rowCount > 0) {
          const [overscanColumnStartIndex, overscanColumnStopIndex, visibleColumnStartIndex, visibleColumnStopIndex] =
            this._getHorizontalRangeToRender();
          const [overscanRowStartIndex, overscanRowStopIndex, visibleRowStartIndex, visibleRowStopIndex] =
            this._getVerticalRangeToRender();
          this._callOnItemsRendered(
            overscanColumnStartIndex,
            overscanColumnStopIndex,
            overscanRowStartIndex,
            overscanRowStopIndex,
            visibleColumnStartIndex,
            visibleColumnStopIndex,
            visibleRowStartIndex,
            visibleRowStopIndex
          );
        }
      }

      if (typeof onScroll === 'function') {
        const { horizontalScrollDirection, scrollLeft, scrollTop, scrollUpdateWasRequested, verticalScrollDirection } =
          this.state;
        this._callOnScroll(
          scrollLeft,
          scrollTop,
          horizontalScrollDirection,
          verticalScrollDirection,
          scrollUpdateWasRequested
        );
      }
    }

    _getItemStyle = (rowIndex: number, columnIndex: number): Object => {
      const { columnWidth, direction, rowHeight } = this.props;

      const itemStyleCache = this._getItemStyleCache(
        this._shouldResetStyleCacheOnItemSizeChange && columnWidth,
        this._shouldResetStyleCacheOnItemSizeChange && direction,
        this._shouldResetStyleCacheOnItemSizeChange && rowHeight
      );

      const key = `${rowIndex}:${columnIndex}`;

      let style;
      if (itemStyleCache.hasOwnProperty(key)) {
        style = itemStyleCache[key];
      } else {
        const offset = getColumnOffset(this.props, columnIndex, this._instanceProps);
        const isRtl = direction === 'rtl';
        itemStyleCache[key] = style = {
          position: 'absolute',
          left: isRtl ? undefined : offset,
          right: isRtl ? offset : undefined,
          top: getRowOffset(this.props, rowIndex, this._instanceProps),
          height: getRowHeight(this.props, rowIndex, this._instanceProps),
          width: getColumnWidth(this.props, columnIndex, this._instanceProps)
        };
      }

      return style;
    };

    _getItemStyleCache = memoizeOne<any>((_: any, __: any, ___: any) => ({}));

    _resetIsScrolling = () => {
      const me = this as any;
      me._resetIsScrollingTimeoutId = null;

      me.props.itemData?.table?._resetRowHeight({ immediate: false });

      this.setState({ isScrolling: false }, () => {
        // Clear style cache after state update has been committed.
        // This way we don't break pure sCU for items that don't use isScrolling param.
        this._getItemStyleCache(-1);
      });
    };

    _resetIsScrollingDebounced = () => {
      if (this._resetIsScrollingTimeoutId !== null) {
        cancelTimeout(this._resetIsScrollingTimeoutId);
      }

      this._resetIsScrollingTimeoutId = requestTimeout(this._resetIsScrolling, IS_SCROLLING_DEBOUNCE_INTERVAL);
    };
  };
}
