import React from 'react'
import './Video.scss'
import PlayVideo from '../../components/PlayVideo/PlayVideo'
import Recommended from '../../components/Recommended/Recommended'

const Video = () => {
    return (
        <div className='play-container'>
            <PlayVideo />
            <Recommended />
        </div>
    )
}

export default Video
