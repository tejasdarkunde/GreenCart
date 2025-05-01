import React from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
    return (
        <div className='mt-16 flex flex-col'>
            <div class="flex flex-col items-center text-center">
                <h3 class="text-lg font-medium text-green-500 mb-2">Contact Us</h3>
                <h1 class="text-3xl md:text-4xl font-semibold mb-4 text-gray-800">Meet Our People</h1>
                <p class="w-3/5 mb-14 text-gray-500 text-sm">We developed a Smart Grocery project using the MERN stack, combining frontend, backend, and database development. The frontend team designed an intuitive user interface, the backend team implemented robust server-side logic and APIs, and the database developer ensured efficient data management and storage.</p>
                <div class="flex flex-wrap gap-6 items-center justify-center">
                    <div class="group flex flex-col items-center py-8 text-sm bg-white border border-gray-300/60 w-64 rounded-md cursor-pointer hover:border-green-500 hover:bg-green-500 transition">
                        <img class="w-24 rounded-full" src={assets.vik} alt="userImage3" />
                        <h2 class="text-gray-700 group-hover:text-white text-lg font-medium mt-2">Vikram Kardile</h2>
                        <p class="text-gray-500 group-hover:text-white/80">Database Developer</p>
                        <p class="text-center text-gray-500/60 group-hover:text-white/60 w-3/4 mt-4">Designs, optimizes, and manages databases to ensure efficient data storage and retrieval.</p>
                        <div class="flex items-center space-x-4 mt-6 text-gray-500 group-hover:text-white">
                            <a href="https://www.linkedin.com/in/vikramkardile?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14.882 0H1.167A1.16 1.16 0 0 0 0 1.161V14.84C0 15.459.519 16 1.167 16H14.83a1.16 1.16 0 0 0 1.166-1.161V1.135C16.048.516 15.53 0 14.882 0M4.744 13.6H2.385V5.987h2.36zM3.552 4.929c-.778 0-1.374-.62-1.374-1.368a1.38 1.38 0 0 1 1.374-1.367 1.38 1.38 0 0 1 1.374 1.367c0 .749-.57 1.368-1.374 1.368M11.33 13.6V9.91c0-.878-.026-2.039-1.245-2.039-1.244 0-1.426.98-1.426 1.961V13.6H6.3V5.987h2.307v1.058h.026c.337-.62 1.09-1.239 2.256-1.239 2.411 0 2.852 1.549 2.852 3.665V13.6z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="https://github.com/vikram-kardile">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.107-.775.418-1.305.76-1.604-2.665-.304-5.466-1.332-5.466-5.932 0-1.31.47-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23A11.52 11.52 0 0 1 12 5.8a11.53 11.53 0 0 1 3.003.405c2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.804 5.624-5.475 5.921.43.372.814 1.104.814 2.224v3.293c0 .32.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="https://www.instagram.com/vikram_k0624?utm_source=qr&igsh=ZDdoNW1weTNpajBp">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.5 2C4.467 2 2 4.467 2 7.5v9C2 19.533 4.467 22 7.5 22h9c3.033 0 5.5-2.467 5.5-5.5v-9C22 4.467 19.533 2 16.5 2h-9zm0 2h9A3.5 3.5 0 0 1 20 7.5v9A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5v-9A3.5 3.5 0 0 1 7.5 4zm9.25 1.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="currentColor" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div class="group flex flex-col items-center py-8 text-sm bg-white border border-gray-300/60 w-64 rounded-md cursor-pointer hover:border-green-500 hover:bg-green-500 transition">
                        <img class="w-24 rounded-full" src={assets.ash} alt="userImage3" />
                        <h2 class="text-gray-700 group-hover:text-white text-lg font-medium mt-2">Ashok More</h2>
                        <p class="text-gray-500 group-hover:text-white/80">Backend Developer</p>
                        <p class="text-center text-gray-500/60 group-hover:text-white/60 w-3/4 mt-4">Creates and maintains server-side logic, APIs, and database interactions to power application functionality.</p>
                        <div class="flex items-center space-x-4 mt-6 text-gray-500 group-hover:text-white">
                            <a href="#">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14.882 0H1.167A1.16 1.16 0 0 0 0 1.161V14.84C0 15.459.519 16 1.167 16H14.83a1.16 1.16 0 0 0 1.166-1.161V1.135C16.048.516 15.53 0 14.882 0M4.744 13.6H2.385V5.987h2.36zM3.552 4.929c-.778 0-1.374-.62-1.374-1.368a1.38 1.38 0 0 1 1.374-1.367 1.38 1.38 0 0 1 1.374 1.367c0 .749-.57 1.368-1.374 1.368M11.33 13.6V9.91c0-.878-.026-2.039-1.245-2.039-1.244 0-1.426.98-1.426 1.961V13.6H6.3V5.987h2.307v1.058h.026c.337-.62 1.09-1.239 2.256-1.239 2.411 0 2.852 1.549 2.852 3.665V13.6z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="#">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.107-.775.418-1.305.76-1.604-2.665-.304-5.466-1.332-5.466-5.932 0-1.31.47-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23A11.52 11.52 0 0 1 12 5.8a11.53 11.53 0 0 1 3.003.405c2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.804 5.624-5.475 5.921.43.372.814 1.104.814 2.224v3.293c0 .32.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="#">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.5 2C4.467 2 2 4.467 2 7.5v9C2 19.533 4.467 22 7.5 22h9c3.033 0 5.5-2.467 5.5-5.5v-9C22 4.467 19.533 2 16.5 2h-9zm0 2h9A3.5 3.5 0 0 1 20 7.5v9A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5v-9A3.5 3.5 0 0 1 7.5 4zm9.25 1.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="currentColor" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    <div class="group flex flex-col items-center py-8 text-sm bg-white border border-gray-300/60 w-64 rounded-md cursor-pointer hover:border-green-500 hover:bg-green-500 transition">
                        <img class="w-24 rounded-full" src={assets.tej} alt="userImage3" />
                        <h2 class="text-gray-700 group-hover:text-white text-lg font-medium mt-2">Tejas Darkunde</h2>
                        <p class="text-gray-500 group-hover:text-white/80">Frontend Developer</p>
                        <p class="text-center text-gray-500/60 group-hover:text-white/60 w-3/4 mt-4"> Builds interactive and visually engaging user interfaces for websites and applications.</p>
                        <div class="flex items-center space-x-4 mt-6 text-gray-500 group-hover:text-white">
                            <a href="www.linkedin.com/in/tejasdarkunde">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14.882 0H1.167A1.16 1.16 0 0 0 0 1.161V14.84C0 15.459.519 16 1.167 16H14.83a1.16 1.16 0 0 0 1.166-1.161V1.135C16.048.516 15.53 0 14.882 0M4.744 13.6H2.385V5.987h2.36zM3.552 4.929c-.778 0-1.374-.62-1.374-1.368a1.38 1.38 0 0 1 1.374-1.367 1.38 1.38 0 0 1 1.374 1.367c0 .749-.57 1.368-1.374 1.368M11.33 13.6V9.91c0-.878-.026-2.039-1.245-2.039-1.244 0-1.426.98-1.426 1.961V13.6H6.3V5.987h2.307v1.058h.026c.337-.62 1.09-1.239 2.256-1.239 2.411 0 2.852 1.549 2.852 3.665V13.6z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="https://github.com/tejasdarkunde">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.996.107-.775.418-1.305.76-1.604-2.665-.304-5.466-1.332-5.466-5.932 0-1.31.47-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23A11.52 11.52 0 0 1 12 5.8a11.53 11.53 0 0 1 3.003.405c2.29-1.552 3.296-1.23 3.296-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.804 5.624-5.475 5.921.43.372.814 1.104.814 2.224v3.293c0 .32.218.694.825.576C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" fill="currentColor" />
                                </svg>
                            </a>
                            <a href="https://www.instagram.com/tejas.darkunde?igsh=MW9jbWdvcjNkYnM3Mg==">
                                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M7.5 2C4.467 2 2 4.467 2 7.5v9C2 19.533 4.467 22 7.5 22h9c3.033 0 5.5-2.467 5.5-5.5v-9C22 4.467 19.533 2 16.5 2h-9zm0 2h9A3.5 3.5 0 0 1 20 7.5v9A3.5 3.5 0 0 1 16.5 20h-9A3.5 3.5 0 0 1 4 16.5v-9A3.5 3.5 0 0 1 7.5 4zm9.25 1.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" fill="currentColor" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Contact
