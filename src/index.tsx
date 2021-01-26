import * as React from 'react';
import { PureComponent } from 'react';
import { omit } from '@tolkam/lib-utils';
import { classNames } from '@tolkam/lib-utils-ui';
import InView, { IOffset, IVisibility, TStopFn } from '@tolkam/react-in-view';

export { ISubject, IContext } from '@tolkam/react-in-view';

const STATUS_MOUNT = 'mount';
const STATUS_BUSY = 'busy';
const STATUS_LOAD = 'load';
const STATUS_ERROR = 'error';

export default class Image extends PureComponent<IProps, IState> {

    /**
     * Loading statuses
     * @var {number}
     */
    public static STATUS_MOUNT = STATUS_MOUNT;
    public static STATUS_BUSY = STATUS_BUSY;
    public static STATUS_LOAD = STATUS_LOAD;
    public static STATUS_ERROR = STATUS_ERROR;

    /**
     * @type {IState}
     */
    public state = {
        status: STATUS_MOUNT,
        next: '',
        prev: '',
    };

    /**
     * @inheritDoc
     */
    public componentDidMount() {
        const that = this;
        const props = that.props;

        if (!props.lazy) {
            that.load(props.src);
        }
    }

    /**
     * @inheritDoc
     */
    public componentDidUpdate(prevProps: IProps) {
        const that = this;
        const { src } = that.props;

        if (prevProps.src !== src) {
            that.load(src);
        }
    }

    /**
     * @inheritDoc
     */
    public render() {
        const that = this;
        const props = that.props;
        const { status, next, prev } = that.state;
        const className = props.className;
        let statusClassName;

        if (props.withClasses) {
            statusClassName = props.classPrefix || (className ? className + '--' : '') + 'status-' + status;
        }

        const imgAttrs: any = omit(
            {
                ...props,
                src: status === STATUS_BUSY ? (!props.noKeep ? prev : '') : next,
                className: classNames(className, statusClassName),
            },
            ['lazy', 'lazyParent', 'noParentAutodetect', 'lazyOffset', 'keepPrevious', 'withClasses', 'classPrefix', 'onChanges']
        );

        const image = <img {...imgAttrs} />;

        return !props.lazy ? image : <InView
            parent={props.lazyParent}
            parentAutodetect={!props.noParentAutodetect}
            offset={props.lazyOffset}
            onChanges={that.onLazyChanges}
            noClasses>{image}</InView>;
    }

    /**
     * Loads image source and updates state
     *
     * @param {string} src
     */
    protected load(src: string) {
        const that = this;
        const doc = document;
        const createImage = doc.createElement.bind(doc, 'img');
        const image = createImage();
        const imageMem = createImage();

        if (!src) {
            return;
        }

        // check if image already in memory
        imageMem.src = src;
        if (imageMem.complete) {
            imageMem.src = '';
            that.setStatus(STATUS_LOAD, src);
            return;
        }

        that.setStatus(STATUS_BUSY, src, () => {

            image.onload = image.onerror = (e: Event) => {
                that.setStatus(e.type === 'load' ? STATUS_LOAD : STATUS_ERROR);
            };

            image.src = src;
        });
    }

    /**
     * Updates loading status depending on image load result
     *
     * @param status
     * @param {string} nextSrc
     * @param {() => void} done
     */
    protected setStatus(status: string, nextSrc: string = '', done?: () => void) {
        const that = this;
        const onChanges = that.props.onChanges;
        const currentSrc = that.state.next;

        that.setState(
            {
                status,
                next: nextSrc || currentSrc,
                prev: currentSrc,
            },
            () => {
                done && done();
                onChanges && onChanges(status);
            },
        );
    }

    /**
     * @param {IVisibility} v
     * @param {TStopFn} stop
     */
    protected onLazyChanges = (v: IVisibility, stop: TStopFn) => {
        const that = this;

        if (v.visible) {
            stop();
            that.load(that.props.src);
        }
    }
}

interface IState {
    status: string;
    next: string;
    prev: string;
}

interface IProps extends React.HTMLProps<Image> {
    src: string;

    // lazy load
    lazy?: boolean;

    // parent to track visibility from
    lazyParent?: HTMLElement;

    // disable autodetect of closest scrolling parent
    noParentAutodetect?: boolean;

    // offset before image element becomes visible
    lazyOffset?: IOffset;

    // do not keep previous src after src update until new src loaded
    noKeep?: boolean;

    // add state classes
    withClasses?: boolean;

    // state classes prefix
    classPrefix?: string;

    // callback on status changes
    onChanges?: (status: string) => void;
}

export { IProps, IOffset };
