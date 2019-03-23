import React from 'react';
import { compose, lifecycle } from 'recompose';
import PropTypes from 'prop-types';
import WaveSurfer from 'wavesurfer.js';

const EVENTS = [
  'audioprocess',
  'error',
  'finish',
  'loading',
  'mouseup',
  'pause',
  'play',
  'ready',
  'scroll',
  'seek',
  'zoom'
];

const capitaliseFirstLetter = (string) =>
  string
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const registerEventsFromProps = (waveSurfer, eventList, props) => {
  eventList.forEach(event => {
    const callBackProp = props[`on${capitaliseFirstLetter(event)}`];
    if (callBackProp)
      waveSurfer.on(event, (...args) =>
        callBackProp({ waveSurfer, args }));
  });
};

const CONTAINER_ID = 'waveform';

const enhance = compose(
  lifecycle({
    state: { waveSurfer: null, isReady: false},
    componentDidMount() {
      let isReady = this.state.isReady;
      const defaultOptions = { container: `#${CONTAINER_ID}` };
      const options = Object.assign({}, this.props.options, defaultOptions);

      const waveSurfer = WaveSurfer.create(options);

      waveSurfer.load(this.props.audioFile, this.props.peaks);

      waveSurfer.on('ready', () => {
        isReady = true;
        if (this.props.playing) waveSurfer.play();
        this.setState({ waveSurfer, isReady });
      });

      registerEventsFromProps(waveSurfer, EVENTS, this.props);

      this.setState({ waveSurfer, isReady });
    },

    componentWillUnmount() {
      const waveSurfer = Object.assign(this.state.waveSurfer);
      waveSurfer.destroy();
      this.setState({ waveSurfer: null, isReady: false });
    },

    componentWillReceiveProps(nextProps) {
      const waveSurfer = Object.assign(this.state.waveSurfer);
      let isNewSource = false;

      if (this.props.audioFile !== nextProps.audioFile) {
        this.setState({ isReady: false });
        waveSurfer.load(this.props.audioFile);
        isNewSource = true;
      }

      if (!isNewSource && (this.props.playing !== nextProps.playing || waveSurfer.isPlaying() !== nextProps.playing))
        nextProps.playing ? waveSurfer.play() : waveSurfer.pause();
    },
  },
  ),
);

const AudioPlayer = enhance(({ isReady, options, audioFile, peaks, playing, loader, className }) => {
    return (
      <div id={CONTAINER_ID} className={className}>
        {!isReady && loader}
      </div>
    );
});

AudioPlayer.propTypes = {
  audioFile: PropTypes.any.required,
  options: PropTypes.object,
  className: PropTypes.string,
  playing: PropTypes.bool,
  peaks: PropTypes.array,
  loader: PropTypes.any
};

export default AudioPlayer;