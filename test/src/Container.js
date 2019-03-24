import React, { Component } from 'react';
import ReactHowler from 'react-howler';
import PropTypes from 'prop-types';
import { PlayButton, Timer} from 'react-soundplayer/components';
import AudioPlayer from './AudioPlayer';
import axios from 'axios';
import Waveform from "react-audio-waveform";

const DEFAULT_DURATION = 456.1495; // have to use this become modifying the audio file breaks 2x speed
const DEFAULT_MP3 = "https://parse-server-ff.s3.amazonaws.com/ae5992f0f5bb1f259bafa41b3771e3bb_call12565815456dwwwwww795896232www-01b59bd3.mp3";

class Container extends Component {
    constructor(props) {
        super(props);
        this.state = {
            playing: false,
            currentTime: 0,
            speedup: false,
            loadErr: false,
            buffer: []
        };
    }

    seek(secs, play) {
        console.log(secs);
        if (secs && secs.seek != null) secs = secs.seek();
        this.player.seek(secs);
        let toSet = { currentTime: secs };
        if (play == true) toSet.playing = true;
        this.setState(toSet);
    }

    toggleRate() {
        let { speedup } = this.state;
        speedup = !speedup;
        this.setState({ speedup });
        this.player._howler.rate(speedup ? 2.0 : 1.0);
    }

    getState() {
        let { playing, currentTime } = this.state;
        return { playing, currentTime };
    }

    getSeek() {
        if (this.playerInterval) clearInterval(this.playerInterval);
        let { mp3url } = this.props;

        this.playerInterval = setInterval(() => {
            if (this.player) {
                let currentTime = this.player.seek();
                const duration = mp3url == DEFAULT_MP3 ? DEFAULT_DURATION : this.player.duration();
                const toSet = { currentTime };
                if (!this.state.duration && duration != null) {
                    toSet.duration = duration;
                }
                if (duration != null) toSet.loadErr = false;
                if (mp3url == DEFAULT_MP3 && currentTime >= DEFAULT_DURATION) {
                    this.player.stop();
                    toSet.playing = false;
                    currentTime = 0;
                }
                this.setState(toSet);
            }
        }, 250);

        // NEw code form here
        let audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        
        axios({url: mp3url, responseType: "arraybuffer"})
            .then(response => {
                var audioData = response.data;
            
                audioCtx.decodeAudioData(audioData, buffer => {
                    let decodedAudioData = buffer.getChannelData(0);
                    console.log(decodedAudioData);
                    const NUMBER_OF_BUCKETS = 100; // number of "bars" the waveform should have
                    let bucketDataSize = Math.floor(decodedAudioData.length / NUMBER_OF_BUCKETS,);
                    let buckets = [];
                    for (var i = 0; i < NUMBER_OF_BUCKETS; i++) {
                        let startingPoint = i * bucketDataSize;
                        let endingPoint = i * bucketDataSize + bucketDataSize;
                        let max = 0;
                        for (var j = startingPoint; j < endingPoint; j++) {
                            if (decodedAudioData[j] > max) {
                                max = decodedAudioData[j];
                            }
                        }
                        let size = Math.abs(max);
                        buckets.push(size / 2);
                    }
                    this.setState({buffer:buckets});
                });
            });

    }

    componentWillUnmount() {
        if (this.playerInterval) clearTimeout(this.playerInterval);
    }

    componentDidMount() {
        this.getSeek();
    }

    isObject(obj) {
        return obj instanceof Object || ((typeof obj === "object") && (obj !== null));
    }

    render() {
        const { mp3url } = this.props;
        let { playing, currentTime, duration, speedup, loadErr } = this.state;
        if (this.isObject(currentTime)) currentTime = 0;
        if (mp3url == DEFAULT_MP3) duration = DEFAULT_DURATION;
        return (
            <div className="ff-audio">
                {duration != null ? <div className="bg-lon">
                 <div className="flex flex-center px2 relative z1">
                    <PlayButton
                        playing={playing}
                        onTogglePlay={() => this.setState({ playing: !playing })}
                        className="flex-none h2 mr2 button button-transparent button-grow rounded"
                    />
                    {/* seeking={Boolean}
                        seekingIcon={ReactElement} */}

                    <div className="sb-soundplayer-volume mr2 flex flex-center">
                        <button onClick={() => this.toggleRate()} className="sb-soundplayer-btn sb-soundplayer-volume-btn flex-none h2 button button-transparent button-grow rounded">
                            <img className={speedup ? 'audio-speedup' : ""} src="/pane/speedup.svg" height={35} />
                        </button>
                    </div>
                    {/* <Progress
                        className="flex-auto bg-darken-3 rounded"
                        innerClassName="rounded-left bg-white"
                        value={((currentTime || 0) / (duration || 1)) * 100 || 0}
                        onSeekTrack={(ts) => this.seek(ts * duration)}
                    /> */}
                    <div className="flex-auto">
                        <Waveform
                            barWidth={4}
                            peaks={this.state.buffer}
                            height={100}
                            pos={currentTime != null ? currentTime : 0}
                            duration={duration}
                            onClick={(sec) => this.seek(sec)}
                            color="#676767"
                            progressGradientColors={[[0, "#888"], [1, "#aaa"]]}
                            />
                    </div>

                    <Timer
                        className={"timer"}
                        duration={duration} // in seconds
                        currentTime={currentTime != null ? currentTime : 0} />
                    </div> 
                    
                </div> : (loadErr ? <div style={{ padding: "5 20px" }}>Unable to load audio: {loadErr}</div> : <div className="progress"><div className="indeterminate" /></div>)}
                <div>
                    <ReactHowler
                        src={mp3url}
                        playing={playing}
                        loop={false}
                        onLoadError={(id, err) => {
                            console.log('Unable to load media', err);
                            this.setState({ loadErr: (err && err.message) || 'Startup error' });
                        }}
                        onLoad={() => this.getSeek()}
                        ref={(ref) => (this.player = ref)}
                    />
                </div>
            </div>
        );
    }
}

Container.propTypes = {
    mp3url: PropTypes.string.isRequired
};

export default Container;