'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

type Mode = 'global' | 'nepal';

/* ------------------------------------------------------------------ */
/*  Real map data                                                       */
/*  Generated from actual country geometry (johan/world.geo.json, via   */
/*  the MIT-licensed `dotted-map` generator) so the World map traces    */
/*  real coastlines and the Nepal map traces Nepal's real border,       */
/*  rather than hand-drawn blobs. Coordinates are in each map's own     */
/*  small local grid (see WORLD_VIEWBOX / NEPAL_VIEWBOX below).         */
/* ------------------------------------------------------------------ */

const WORLD_VIEWBOX = { w: 71, h: 36 };
const NEPAL_VIEWBOX = { w: 43, h: 24 };

// [x, y] background dots tracing each region's real landmass/border
const WORLD_DOTS: [number, number][] = [[2.5,0],[9.5,0],[11.5,0],[12.5,0],[15.5,0],[17.5,0],[18.5,0],[19.5,0],[24.5,0],[25.5,0],[26.5,0],[27.5,0],[28.5,0],[29.5,0],[30.5,0],[41.5,0],[47.5,0],[50.5,0],[51.5,0],[52.5,0],[53.5,0],[54.5,0],[55.5,0],[56.5,0],[57.5,0],[58.5,0],[59.5,0],[60.5,0],[61.5,0],[62.5,0],[63.5,0],[64.5,0],[65.5,0],[66.5,0],[67.5,0],[2,0.9],[3,0.9],[4,0.9],[5,0.9],[8,0.9],[9,0.9],[11,0.9],[12,0.9],[13,0.9],[14,0.9],[15,0.9],[16,0.9],[18,0.9],[20,0.9],[21,0.9],[24,0.9],[25,0.9],[26,0.9],[27,0.9],[28,0.9],[29,0.9],[30,0.9],[40,0.9],[41,0.9],[42,0.9],[50,0.9],[52,0.9],[53,0.9],[54,0.9],[55,0.9],[56,0.9],[57,0.9],[58,0.9],[59,0.9],[60,0.9],[61,0.9],[62,0.9],[63,0.9],[64,0.9],[65,0.9],[66,0.9],[67,0.9],[68,0.9],[69,0.9],[70,0.9],[0.5,1.7],[1.5,1.7],[2.5,1.7],[3.5,1.7],[4.5,1.7],[5.5,1.7],[6.5,1.7],[7.5,1.7],[8.5,1.7],[9.5,1.7],[10.5,1.7],[16.5,1.7],[17.5,1.7],[19.5,1.7],[20.5,1.7],[24.5,1.7],[25.5,1.7],[26.5,1.7],[27.5,1.7],[28.5,1.7],[39.5,1.7],[40.5,1.7],[41.5,1.7],[42.5,1.7],[43.5,1.7],[46.5,1.7],[47.5,1.7],[48.5,1.7],[49.5,1.7],[50.5,1.7],[51.5,1.7],[52.5,1.7],[53.5,1.7],[54.5,1.7],[55.5,1.7],[56.5,1.7],[57.5,1.7],[58.5,1.7],[59.5,1.7],[60.5,1.7],[61.5,1.7],[62.5,1.7],[63.5,1.7],[64.5,1.7],[65.5,1.7],[66.5,1.7],[67.5,1.7],[68.5,1.7],[69.5,1.7],[70.5,1.7],[2,2.6],[3,2.6],[4,2.6],[5,2.6],[6,2.6],[7,2.6],[8,2.6],[9,2.6],[10,2.6],[11,2.6],[12,2.6],[13,2.6],[14,2.6],[15,2.6],[16,2.6],[17,2.6],[20,2.6],[21,2.6],[22,2.6],[25,2.6],[26,2.6],[27,2.6],[28,2.6],[39,2.6],[40,2.6],[41,2.6],[42,2.6],[43,2.6],[44,2.6],[45,2.6],[46,2.6],[47,2.6],[48,2.6],[49,2.6],[50,2.6],[51,2.6],[52,2.6],[53,2.6],[54,2.6],[55,2.6],[56,2.6],[57,2.6],[58,2.6],[59,2.6],[60,2.6],[61,2.6],[62,2.6],[63,2.6],[64,2.6],[65,2.6],[66,2.6],[67,2.6],[68,2.6],[69,2.6],[70,2.6],[0.5,3.5],[1.5,3.5],[2.5,3.5],[3.5,3.5],[4.5,3.5],[5.5,3.5],[6.5,3.5],[7.5,3.5],[8.5,3.5],[9.5,3.5],[10.5,3.5],[11.5,3.5],[12.5,3.5],[13.5,3.5],[14.5,3.5],[15.5,3.5],[16.5,3.5],[17.5,3.5],[19.5,3.5],[20.5,3.5],[24.5,3.5],[25.5,3.5],[26.5,3.5],[30.5,3.5],[31.5,3.5],[32.5,3.5],[38.5,3.5],[39.5,3.5],[41.5,3.5],[42.5,3.5],[43.5,3.5],[44.5,3.5],[45.5,3.5],[46.5,3.5],[47.5,3.5],[48.5,3.5],[49.5,3.5],[50.5,3.5],[51.5,3.5],[52.5,3.5],[53.5,3.5],[54.5,3.5],[55.5,3.5],[56.5,3.5],[57.5,3.5],[58.5,3.5],[59.5,3.5],[60.5,3.5],[61.5,3.5],[62.5,3.5],[63.5,3.5],[64.5,3.5],[65.5,3.5],[66.5,3.5],[67.5,3.5],[68.5,3.5],[69.5,3.5],[70.5,3.5],[2,4.3],[3,4.3],[4,4.3],[5,4.3],[6,4.3],[7,4.3],[8,4.3],[9,4.3],[10,4.3],[11,4.3],[12,4.3],[13,4.3],[14,4.3],[15,4.3],[16,4.3],[21,4.3],[25,4.3],[26,4.3],[38,4.3],[39,4.3],[41,4.3],[42,4.3],[43,4.3],[44,4.3],[45,4.3],[46,4.3],[47,4.3],[48,4.3],[49,4.3],[50,4.3],[51,4.3],[52,4.3],[53,4.3],[54,4.3],[55,4.3],[56,4.3],[57,4.3],[58,4.3],[59,4.3],[60,4.3],[61,4.3],[62,4.3],[63,4.3],[64,4.3],[65,4.3],[66,4.3],[67,4.3],[68,4.3],[69,4.3],[70,4.3],[1.5,5.2],[2.5,5.2],[3.5,5.2],[4.5,5.2],[5.5,5.2],[6.5,5.2],[7.5,5.2],[8.5,5.2],[9.5,5.2],[10.5,5.2],[11.5,5.2],[12.5,5.2],[13.5,5.2],[14.5,5.2],[15.5,5.2],[19.5,5.2],[25.5,5.2],[37.5,5.2],[38.5,5.2],[40.5,5.2],[41.5,5.2],[42.5,5.2],[43.5,5.2],[44.5,5.2],[45.5,5.2],[46.5,5.2],[47.5,5.2],[48.5,5.2],[49.5,5.2],[50.5,5.2],[51.5,5.2],[52.5,5.2],[53.5,5.2],[54.5,5.2],[55.5,5.2],[56.5,5.2],[57.5,5.2],[58.5,5.2],[59.5,5.2],[60.5,5.2],[61.5,5.2],[62.5,5.2],[63.5,5.2],[64.5,5.2],[65.5,5.2],[66.5,5.2],[67.5,5.2],[68.5,5.2],[69.5,5.2],[70.5,5.2],[2,6.1],[3,6.1],[7,6.1],[8,6.1],[9,6.1],[10,6.1],[11,6.1],[12,6.1],[13,6.1],[14,6.1],[15,6.1],[19,6.1],[20,6.1],[22,6.1],[37,6.1],[38,6.1],[39,6.1],[41,6.1],[42,6.1],[43,6.1],[44,6.1],[45,6.1],[46,6.1],[47,6.1],[48,6.1],[49,6.1],[50,6.1],[51,6.1],[52,6.1],[53,6.1],[54,6.1],[55,6.1],[56,6.1],[57,6.1],[58,6.1],[59,6.1],[60,6.1],[61,6.1],[62,6.1],[63,6.1],[64,6.1],[65,6.1],[68,6.1],[7.5,6.9],[8.5,6.9],[9.5,6.9],[10.5,6.9],[11.5,6.9],[12.5,6.9],[13.5,6.9],[14.5,6.9],[15.5,6.9],[16.5,6.9],[19.5,6.9],[20.5,6.9],[21.5,6.9],[22.5,6.9],[34.5,6.9],[37.5,6.9],[38.5,6.9],[41.5,6.9],[42.5,6.9],[43.5,6.9],[44.5,6.9],[45.5,6.9],[46.5,6.9],[47.5,6.9],[48.5,6.9],[49.5,6.9],[50.5,6.9],[51.5,6.9],[52.5,6.9],[53.5,6.9],[54.5,6.9],[55.5,6.9],[56.5,6.9],[57.5,6.9],[58.5,6.9],[59.5,6.9],[60.5,6.9],[61.5,6.9],[62.5,6.9],[63.5,6.9],[64.5,6.9],[69.5,6.9],[1,7.8],[8,7.8],[9,7.8],[10,7.8],[11,7.8],[12,7.8],[13,7.8],[14,7.8],[15,7.8],[16,7.8],[17,7.8],[18,7.8],[19,7.8],[20,7.8],[21,7.8],[22,7.8],[23,7.8],[34,7.8],[35,7.8],[40,7.8],[41,7.8],[42,7.8],[43,7.8],[44,7.8],[45,7.8],[46,7.8],[47,7.8],[48,7.8],[49,7.8],[50,7.8],[51,7.8],[52,7.8],[53,7.8],[54,7.8],[55,7.8],[56,7.8],[57,7.8],[58,7.8],[59,7.8],[60,7.8],[61,7.8],[62,7.8],[63,7.8],[64,7.8],[69,7.8],[8.5,8.7],[9.5,8.7],[10.5,8.7],[11.5,8.7],[12.5,8.7],[13.5,8.7],[14.5,8.7],[15.5,8.7],[16.5,8.7],[17.5,8.7],[19.5,8.7],[20.5,8.7],[21.5,8.7],[22.5,8.7],[23.5,8.7],[33.5,8.7],[35.5,8.7],[36.5,8.7],[37.5,8.7],[38.5,8.7],[39.5,8.7],[40.5,8.7],[41.5,8.7],[42.5,8.7],[43.5,8.7],[44.5,8.7],[45.5,8.7],[46.5,8.7],[47.5,8.7],[48.5,8.7],[49.5,8.7],[50.5,8.7],[51.5,8.7],[52.5,8.7],[53.5,8.7],[54.5,8.7],[55.5,8.7],[56.5,8.7],[57.5,8.7],[58.5,8.7],[59.5,8.7],[60.5,8.7],[61.5,8.7],[62.5,8.7],[63.5,8.7],[64.5,8.7],[65.5,8.7],[9,9.5],[10,9.5],[11,9.5],[12,9.5],[13,9.5],[14,9.5],[15,9.5],[16,9.5],[17,9.5],[18,9.5],[19,9.5],[20,9.5],[21,9.5],[22,9.5],[36,9.5],[37,9.5],[38,9.5],[39,9.5],[40,9.5],[41,9.5],[42,9.5],[43,9.5],[44,9.5],[45,9.5],[46,9.5],[47,9.5],[48,9.5],[49,9.5],[50,9.5],[51,9.5],[52,9.5],[53,9.5],[54,9.5],[55,9.5],[56,9.5],[57,9.5],[58,9.5],[59,9.5],[60,9.5],[61,9.5],[62,9.5],[63,9.5],[64,9.5],[65,9.5],[9.5,10.4],[10.5,10.4],[11.5,10.4],[12.5,10.4],[13.5,10.4],[14.5,10.4],[15.5,10.4],[16.5,10.4],[17.5,10.4],[18.5,10.4],[19.5,10.4],[20.5,10.4],[21.5,10.4],[35.5,10.4],[36.5,10.4],[37.5,10.4],[38.5,10.4],[39.5,10.4],[40.5,10.4],[41.5,10.4],[42.5,10.4],[44.5,10.4],[45.5,10.4],[46.5,10.4],[47.5,10.4],[48.5,10.4],[49.5,10.4],[50.5,10.4],[51.5,10.4],[52.5,10.4],[53.5,10.4],[54.5,10.4],[55.5,10.4],[56.5,10.4],[57.5,10.4],[58.5,10.4],[59.5,10.4],[60.5,10.4],[61.5,10.4],[62.5,10.4],[63.5,10.4],[64.5,10.4],[65.5,10.4],[10,11.3],[11,11.3],[12,11.3],[13,11.3],[14,11.3],[15,11.3],[16,11.3],[17,11.3],[18,11.3],[19,11.3],[20,11.3],[21,11.3],[36,11.3],[37,11.3],[38,11.3],[39,11.3],[40,11.3],[41,11.3],[44,11.3],[45,11.3],[47,11.3],[48,11.3],[49,11.3],[50,11.3],[51,11.3],[52,11.3],[53,11.3],[54,11.3],[55,11.3],[56,11.3],[57,11.3],[58,11.3],[59,11.3],[60,11.3],[61,11.3],[62,11.3],[63,11.3],[64,11.3],[9.5,12.1],[10.5,12.1],[11.5,12.1],[12.5,12.1],[13.5,12.1],[14.5,12.1],[15.5,12.1],[16.5,12.1],[17.5,12.1],[18.5,12.1],[19.5,12.1],[34.5,12.1],[35.5,12.1],[38.5,12.1],[40.5,12.1],[41.5,12.1],[42.5,12.1],[44.5,12.1],[45.5,12.1],[47.5,12.1],[48.5,12.1],[49.5,12.1],[50.5,12.1],[51.5,12.1],[52.5,12.1],[53.5,12.1],[54.5,12.1],[55.5,12.1],[56.5,12.1],[57.5,12.1],[58.5,12.1],[59.5,12.1],[60.5,12.1],[61.5,12.1],[62.5,12.1],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],[19,13],[34,13],[35,13],[40,13],[42,13],[43,13],[44,13],[45,13],[47,13],[48,13],[49,13],[50,13],[51,13],[52,13],[53,13],[54,13],[55,13],[56,13],[57,13],[58,13],[59,13],[60,13],[62,13],[65,13],[10.5,13.9],[11.5,13.9],[12.5,13.9],[13.5,13.9],[14.5,13.9],[15.5,13.9],[16.5,13.9],[17.5,13.9],[18.5,13.9],[34.5,13.9],[35.5,13.9],[36.5,13.9],[37.5,13.9],[42.5,13.9],[43.5,13.9],[44.5,13.9],[45.5,13.9],[46.5,13.9],[47.5,13.9],[48.5,13.9],[49.5,13.9],[50.5,13.9],[51.5,13.9],[52.5,13.9],[53.5,13.9],[54.5,13.9],[55.5,13.9],[56.5,13.9],[57.5,13.9],[58.5,13.9],[59.5,13.9],[60.5,13.9],[63.5,13.9],[64.5,13.9],[11,14.7],[12,14.7],[13,14.7],[14,14.7],[15,14.7],[16,14.7],[17,14.7],[18,14.7],[34,14.7],[35,14.7],[36,14.7],[37,14.7],[38,14.7],[40,14.7],[41,14.7],[42,14.7],[43,14.7],[44,14.7],[45,14.7],[46,14.7],[47,14.7],[48,14.7],[49,14.7],[50,14.7],[51,14.7],[52,14.7],[53,14.7],[54,14.7],[55,14.7],[56,14.7],[57,14.7],[58,14.7],[59,14.7],[60,14.7],[61,14.7],[11.5,15.6],[12.5,15.6],[13.5,15.6],[14.5,15.6],[18.5,15.6],[33.5,15.6],[34.5,15.6],[35.5,15.6],[36.5,15.6],[37.5,15.6],[38.5,15.6],[39.5,15.6],[40.5,15.6],[41.5,15.6],[42.5,15.6],[43.5,15.6],[44.5,15.6],[45.5,15.6],[47.5,15.6],[48.5,15.6],[49.5,15.6],[50.5,15.6],[51.5,15.6],[52.5,15.6],[53.5,15.6],[54.5,15.6],[55.5,15.6],[56.5,15.6],[57.5,15.6],[58.5,15.6],[59.5,15.6],[60.5,15.6],[13,16.5],[14,16.5],[33,16.5],[34,16.5],[35,16.5],[36,16.5],[37,16.5],[38,16.5],[39,16.5],[40,16.5],[41,16.5],[42,16.5],[43,16.5],[44,16.5],[45,16.5],[46,16.5],[47,16.5],[50,16.5],[51,16.5],[52,16.5],[53,16.5],[54,16.5],[55,16.5],[56,16.5],[57,16.5],[58,16.5],[59,16.5],[60,16.5],[61,16.5],[13.5,17.3],[14.5,17.3],[16.5,17.3],[19.5,17.3],[32.5,17.3],[33.5,17.3],[34.5,17.3],[35.5,17.3],[36.5,17.3],[37.5,17.3],[38.5,17.3],[39.5,17.3],[40.5,17.3],[41.5,17.3],[42.5,17.3],[44.5,17.3],[45.5,17.3],[46.5,17.3],[47.5,17.3],[51.5,17.3],[52.5,17.3],[53.5,17.3],[55.5,17.3],[56.5,17.3],[57.5,17.3],[15,18.2],[16,18.2],[33,18.2],[34,18.2],[35,18.2],[36,18.2],[37,18.2],[38,18.2],[39,18.2],[40,18.2],[41,18.2],[42,18.2],[43,18.2],[45,18.2],[46,18.2],[52,18.2],[57,18.2],[58,18.2],[61,18.2],[17.5,19.1],[32.5,19.1],[33.5,19.1],[34.5,19.1],[35.5,19.1],[36.5,19.1],[37.5,19.1],[38.5,19.1],[39.5,19.1],[40.5,19.1],[41.5,19.1],[42.5,19.1],[43.5,19.1],[44.5,19.1],[51.5,19.1],[56.5,19.1],[57.5,19.1],[58.5,19.1],[19,19.9],[20,19.9],[21,19.9],[22,19.9],[33,19.9],[34,19.9],[35,19.9],[36,19.9],[37,19.9],[38,19.9],[39,19.9],[40,19.9],[41,19.9],[42,19.9],[43,19.9],[44,19.9],[45,19.9],[46,19.9],[62,19.9],[19.5,20.8],[20.5,20.8],[21.5,20.8],[22.5,20.8],[23.5,20.8],[24.5,20.8],[37.5,20.8],[38.5,20.8],[39.5,20.8],[40.5,20.8],[41.5,20.8],[42.5,20.8],[43.5,20.8],[44.5,20.8],[45.5,20.8],[19,21.7],[20,21.7],[21,21.7],[22,21.7],[23,21.7],[24,21.7],[38,21.7],[39,21.7],[40,21.7],[41,21.7],[42,21.7],[43,21.7],[44,21.7],[57,21.7],[59,21.7],[60,21.7],[18.5,22.5],[19.5,22.5],[20.5,22.5],[21.5,22.5],[22.5,22.5],[23.5,22.5],[24.5,22.5],[25.5,22.5],[26.5,22.5],[38.5,22.5],[39.5,22.5],[40.5,22.5],[41.5,22.5],[42.5,22.5],[43.5,22.5],[57.5,22.5],[64.5,22.5],[65.5,22.5],[19,23.4],[20,23.4],[21,23.4],[22,23.4],[23,23.4],[24,23.4],[25,23.4],[26,23.4],[27,23.4],[28,23.4],[39,23.4],[40,23.4],[41,23.4],[42,23.4],[43,23.4],[59,23.4],[65,23.4],[19.5,24.2],[20.5,24.2],[21.5,24.2],[22.5,24.2],[23.5,24.2],[24.5,24.2],[25.5,24.2],[26.5,24.2],[27.5,24.2],[38.5,24.2],[39.5,24.2],[40.5,24.2],[41.5,24.2],[42.5,24.2],[43.5,24.2],[63.5,24.2],[65.5,24.2],[20,25.1],[21,25.1],[22,25.1],[23,25.1],[24,25.1],[25,25.1],[26,25.1],[27,25.1],[38,25.1],[39,25.1],[40,25.1],[41,25.1],[42,25.1],[43,25.1],[46,25.1],[62,25.1],[63,25.1],[64,25.1],[66,25.1],[21.5,26],[22.5,26],[23.5,26],[24.5,26],[25.5,26],[26.5,26],[38.5,26],[39.5,26],[40.5,26],[41.5,26],[42.5,26],[45.5,26],[61.5,26],[62.5,26],[63.5,26],[64.5,26],[65.5,26],[66.5,26],[21,26.8],[22,26.8],[23,26.8],[24,26.8],[25,26.8],[39,26.8],[40,26.8],[41,26.8],[42,26.8],[43,26.8],[45,26.8],[60,26.8],[61,26.8],[62,26.8],[63,26.8],[64,26.8],[65,26.8],[66,26.8],[67,26.8],[21.5,27.7],[22.5,27.7],[23.5,27.7],[24.5,27.7],[39.5,27.7],[40.5,27.7],[41.5,27.7],[60.5,27.7],[61.5,27.7],[62.5,27.7],[63.5,27.7],[64.5,27.7],[65.5,27.7],[66.5,27.7],[67.5,27.7],[21,28.6],[22,28.6],[23,28.6],[24,28.6],[40,28.6],[41,28.6],[60,28.6],[61,28.6],[62,28.6],[63,28.6],[64,28.6],[65,28.6],[66,28.6],[67,28.6],[20.5,29.4],[21.5,29.4],[22.5,29.4],[23.5,29.4],[60.5,29.4],[65.5,29.4],[66.5,29.4],[20,30.3],[21,30.3],[22,30.3],[23,30.3],[66,30.3],[20.5,31.2],[21.5,31.2],[66.5,31.2],[21,32],[20.5,32.9],[20,33.8],[21,33.8],[20.5,34.6],[21,35.5]];
const NEPAL_DOTS: [number, number][] = [[7,0.9],[8,0.9],[9,0.9],[5.5,1.7],[6.5,1.7],[7.5,1.7],[8.5,1.7],[9.5,1.7],[10.5,1.7],[11.5,1.7],[5,2.6],[6,2.6],[7,2.6],[8,2.6],[9,2.6],[10,2.6],[11,2.6],[12,2.6],[3.5,3.5],[4.5,3.5],[5.5,3.5],[6.5,3.5],[7.5,3.5],[8.5,3.5],[9.5,3.5],[10.5,3.5],[11.5,3.5],[12.5,3.5],[13.5,3.5],[3,4.3],[4,4.3],[5,4.3],[6,4.3],[7,4.3],[8,4.3],[9,4.3],[10,4.3],[11,4.3],[12,4.3],[13,4.3],[14,4.3],[15,4.3],[2.5,5.2],[3.5,5.2],[4.5,5.2],[5.5,5.2],[6.5,5.2],[7.5,5.2],[8.5,5.2],[9.5,5.2],[10.5,5.2],[11.5,5.2],[12.5,5.2],[13.5,5.2],[14.5,5.2],[15.5,5.2],[2,6.1],[3,6.1],[4,6.1],[5,6.1],[6,6.1],[7,6.1],[8,6.1],[9,6.1],[10,6.1],[11,6.1],[12,6.1],[13,6.1],[14,6.1],[15,6.1],[16,6.1],[17,6.1],[18,6.1],[1.5,6.9],[2.5,6.9],[3.5,6.9],[4.5,6.9],[5.5,6.9],[6.5,6.9],[7.5,6.9],[8.5,6.9],[9.5,6.9],[10.5,6.9],[11.5,6.9],[12.5,6.9],[13.5,6.9],[14.5,6.9],[15.5,6.9],[16.5,6.9],[17.5,6.9],[18.5,6.9],[19.5,6.9],[1,7.8],[2,7.8],[3,7.8],[4,7.8],[5,7.8],[6,7.8],[7,7.8],[8,7.8],[9,7.8],[10,7.8],[11,7.8],[12,7.8],[13,7.8],[14,7.8],[15,7.8],[16,7.8],[17,7.8],[18,7.8],[19,7.8],[20,7.8],[0.5,8.7],[1.5,8.7],[2.5,8.7],[3.5,8.7],[4.5,8.7],[5.5,8.7],[6.5,8.7],[7.5,8.7],[8.5,8.7],[9.5,8.7],[10.5,8.7],[11.5,8.7],[12.5,8.7],[13.5,8.7],[14.5,8.7],[15.5,8.7],[16.5,8.7],[17.5,8.7],[18.5,8.7],[19.5,8.7],[20.5,8.7],[1,9.5],[2,9.5],[3,9.5],[4,9.5],[5,9.5],[6,9.5],[7,9.5],[8,9.5],[9,9.5],[10,9.5],[11,9.5],[12,9.5],[13,9.5],[14,9.5],[15,9.5],[16,9.5],[17,9.5],[18,9.5],[19,9.5],[20,9.5],[21,9.5],[22,9.5],[1.5,10.4],[2.5,10.4],[3.5,10.4],[4.5,10.4],[5.5,10.4],[6.5,10.4],[7.5,10.4],[8.5,10.4],[9.5,10.4],[10.5,10.4],[11.5,10.4],[12.5,10.4],[13.5,10.4],[14.5,10.4],[15.5,10.4],[16.5,10.4],[17.5,10.4],[18.5,10.4],[19.5,10.4],[20.5,10.4],[21.5,10.4],[22.5,10.4],[23.5,10.4],[24.5,10.4],[4,11.3],[5,11.3],[6,11.3],[7,11.3],[8,11.3],[9,11.3],[10,11.3],[11,11.3],[12,11.3],[13,11.3],[14,11.3],[15,11.3],[16,11.3],[17,11.3],[18,11.3],[19,11.3],[20,11.3],[21,11.3],[22,11.3],[23,11.3],[24,11.3],[25,11.3],[26,11.3],[27,11.3],[5.5,12.1],[6.5,12.1],[7.5,12.1],[8.5,12.1],[9.5,12.1],[10.5,12.1],[11.5,12.1],[12.5,12.1],[13.5,12.1],[14.5,12.1],[15.5,12.1],[16.5,12.1],[17.5,12.1],[18.5,12.1],[19.5,12.1],[20.5,12.1],[21.5,12.1],[22.5,12.1],[23.5,12.1],[24.5,12.1],[25.5,12.1],[26.5,12.1],[27.5,12.1],[7,13],[8,13],[9,13],[10,13],[11,13],[12,13],[13,13],[14,13],[15,13],[16,13],[17,13],[18,13],[19,13],[20,13],[21,13],[22,13],[23,13],[24,13],[25,13],[26,13],[27,13],[28,13],[29,13],[8.5,13.9],[9.5,13.9],[10.5,13.9],[11.5,13.9],[12.5,13.9],[13.5,13.9],[14.5,13.9],[15.5,13.9],[16.5,13.9],[17.5,13.9],[18.5,13.9],[19.5,13.9],[20.5,13.9],[21.5,13.9],[22.5,13.9],[23.5,13.9],[24.5,13.9],[25.5,13.9],[26.5,13.9],[27.5,13.9],[28.5,13.9],[29.5,13.9],[30.5,13.9],[31.5,13.9],[32.5,13.9],[10,14.7],[11,14.7],[12,14.7],[13,14.7],[14,14.7],[15,14.7],[16,14.7],[17,14.7],[18,14.7],[19,14.7],[20,14.7],[21,14.7],[22,14.7],[23,14.7],[24,14.7],[25,14.7],[26,14.7],[27,14.7],[28,14.7],[29,14.7],[30,14.7],[31,14.7],[32,14.7],[33,14.7],[34,14.7],[35,14.7],[36,14.7],[11.5,15.6],[12.5,15.6],[13.5,15.6],[14.5,15.6],[15.5,15.6],[16.5,15.6],[17.5,15.6],[18.5,15.6],[19.5,15.6],[20.5,15.6],[21.5,15.6],[22.5,15.6],[23.5,15.6],[24.5,15.6],[25.5,15.6],[26.5,15.6],[27.5,15.6],[28.5,15.6],[29.5,15.6],[30.5,15.6],[31.5,15.6],[32.5,15.6],[33.5,15.6],[34.5,15.6],[35.5,15.6],[36.5,15.6],[37.5,15.6],[38.5,15.6],[39.5,15.6],[40.5,15.6],[41.5,15.6],[42.5,15.6],[14,16.5],[15,16.5],[16,16.5],[17,16.5],[18,16.5],[19,16.5],[20,16.5],[21,16.5],[22,16.5],[23,16.5],[24,16.5],[25,16.5],[26,16.5],[27,16.5],[28,16.5],[29,16.5],[30,16.5],[31,16.5],[32,16.5],[33,16.5],[34,16.5],[35,16.5],[36,16.5],[37,16.5],[38,16.5],[39,16.5],[40,16.5],[41,16.5],[42,16.5],[15.5,17.3],[16.5,17.3],[17.5,17.3],[18.5,17.3],[19.5,17.3],[20.5,17.3],[21.5,17.3],[22.5,17.3],[23.5,17.3],[24.5,17.3],[25.5,17.3],[26.5,17.3],[27.5,17.3],[28.5,17.3],[29.5,17.3],[30.5,17.3],[31.5,17.3],[32.5,17.3],[33.5,17.3],[34.5,17.3],[35.5,17.3],[36.5,17.3],[37.5,17.3],[38.5,17.3],[39.5,17.3],[40.5,17.3],[41.5,17.3],[17,18.2],[18,18.2],[19,18.2],[20,18.2],[21,18.2],[22,18.2],[23,18.2],[24,18.2],[25,18.2],[26,18.2],[27,18.2],[28,18.2],[29,18.2],[30,18.2],[31,18.2],[32,18.2],[33,18.2],[34,18.2],[35,18.2],[36,18.2],[37,18.2],[38,18.2],[39,18.2],[40,18.2],[41,18.2],[42,18.2],[24.5,19.1],[25.5,19.1],[26.5,19.1],[27.5,19.1],[28.5,19.1],[29.5,19.1],[30.5,19.1],[31.5,19.1],[32.5,19.1],[33.5,19.1],[34.5,19.1],[35.5,19.1],[36.5,19.1],[37.5,19.1],[38.5,19.1],[39.5,19.1],[40.5,19.1],[41.5,19.1],[42.5,19.1],[26,19.9],[27,19.9],[28,19.9],[29,19.9],[30,19.9],[31,19.9],[32,19.9],[33,19.9],[34,19.9],[35,19.9],[36,19.9],[37,19.9],[38,19.9],[39,19.9],[40,19.9],[41,19.9],[42,19.9],[26.5,20.8],[27.5,20.8],[28.5,20.8],[29.5,20.8],[30.5,20.8],[31.5,20.8],[32.5,20.8],[33.5,20.8],[34.5,20.8],[35.5,20.8],[36.5,20.8],[37.5,20.8],[38.5,20.8],[39.5,20.8],[40.5,20.8],[41.5,20.8],[42.5,20.8],[28,21.7],[29,21.7],[30,21.7],[31,21.7],[32,21.7],[33,21.7],[34,21.7],[35,21.7],[36,21.7],[37,21.7],[38,21.7],[39,21.7],[40,21.7],[41,21.7],[42,21.7],[31.5,22.5],[32.5,22.5],[33.5,22.5],[34.5,22.5],[35.5,22.5],[36.5,22.5],[37.5,22.5],[38.5,22.5],[39.5,22.5],[40.5,22.5],[41.5,22.5],[42.5,22.5],[36,23.4],[37,23.4],[38,23.4],[39,23.4],[40,23.4],[41,23.4],[42,23.4]];

// City pins, positioned by real lat/lng through the same projection as
// the dots above, so they land exactly on the map they describe
type CityPin = { x: number; y: number; label: string; primary: boolean };
const WORLD_PINS: CityPin[] = [{"x":53.5,"y":15.6,"label":"Kathmandu","primary":true},{"x":47,"y":16.5,"label":"Dubai","primary":false},{"x":51.5,"y":15.6,"label":"Delhi","primary":false},{"x":35.5,"y":8.7,"label":"London","primary":false},{"x":19.5,"y":12.1,"label":"New York","primary":false},{"x":67.5,"y":29.4,"label":"Sydney","primary":false},{"x":65.5,"y":13.9,"label":"Tokyo","primary":false},{"x":60.5,"y":12.1,"label":"Beijing","primary":false}];
const NEPAL_PINS: CityPin[] = [{"x":28,"y":16.5,"label":"Kathmandu","primary":true},{"x":21,"y":13,"label":"Pokhara","primary":false},{"x":38,"y":23.4,"label":"Biratnagar","primary":false},{"x":38,"y":21.7,"label":"Dharan","primary":false},{"x":18,"y":16.5,"label":"Butwal","primary":false},{"x":8.5,"y":13.9,"label":"Nepalgunj","primary":false},{"x":23,"y":16.5,"label":"Bharatpur","primary":false},{"x":25.5,"y":20.8,"label":"Birgunj","primary":false}];

const LOGO_NAVY = '#041938';

/* ------------------------------------------------------------------ */
/*  Map                                                                 */
/* ------------------------------------------------------------------ */

function RouteMap({ mode }: { mode: Mode }) {
  const dots = mode === 'global' ? WORLD_DOTS : NEPAL_DOTS;
  const pins = mode === 'global' ? WORLD_PINS : NEPAL_PINS;
  const vb = mode === 'global' ? WORLD_VIEWBOX : NEPAL_VIEWBOX;
  const primary = pins.find((p) => p.primary) ?? pins[0];
  const secondary = pins.filter((p) => !p.primary);

  return (
    <svg
      viewBox={`0 0 ${vb.w} ${vb.h}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="0.35" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* real landmass / border, rendered as a dot grid */}
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.4" fill="rgba(255,255,255,0.14)" />
      ))}

      {/* delivery routes, fanning out from the primary hub */}
      {secondary.map((pin, i) => {
        const cpx = (primary.x + pin.x) / 2;
        const cpy = Math.min(primary.y, pin.y) - vb.h * 0.22 - i * (vb.h * 0.015);
        const d = `M ${primary.x} ${primary.y} Q ${cpx} ${cpy} ${pin.x} ${pin.y}`;
        return (
          <g key={pin.label}>
            <path d={d} fill="none" stroke="rgba(239,176,0,0.12)" strokeWidth="0.16" />
            <path
              d={d}
              fill="none"
              stroke="rgba(239,176,0,0.75)"
              strokeWidth="0.12"
              strokeDasharray="0.7 1"
              filter="url(#glow)"
              style={{ animation: `routePulse ${2 + i * 0.3}s ease-in-out ${i * 0.4}s infinite` }}
            />
          </g>
        );
      })}

      {/* city pins */}
      {pins.map((pin) => (
        <g key={pin.label}>
          {pin.primary ? (
            <>
              <circle cx={pin.x} cy={pin.y} r="1.7" fill="rgba(239,176,0,0.15)" />
              <circle cx={pin.x} cy={pin.y} r="1" fill="rgba(239,176,0,0.3)" className="glow-dot" />
              <circle cx={pin.x} cy={pin.y} r="0.62" fill="#EFB000" filter="url(#glow)" />
            </>
          ) : (
            <>
              <circle cx={pin.x} cy={pin.y} r="0.7" fill="rgba(239,176,0,0.2)" className="glow-dot" />
              <circle cx={pin.x} cy={pin.y} r="0.38" fill="#EFB000" opacity="0.9" />
            </>
          )}
        </g>
      ))}
    </svg>
  );
}


/* ------------------------------------------------------------------ */
/*  Small decorative SVGs                                               */
/* ------------------------------------------------------------------ */

function YakSVG() {
  return (
    <svg viewBox="0 0 80 50" width="70" height="44" aria-hidden="true">
      <ellipse cx="40" cy="30" rx="22" ry="12" fill="#EFB000" />
      <ellipse cx="60" cy="24" rx="10" ry="8" fill="#EFB000" />
      <path d="M56 18 Q52 10 48 14" stroke="#FFD040" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M64 18 Q68 10 72 14" stroke="#FFD040" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="63" cy="22" r="2" fill={LOGO_NAVY} />
      <circle cx="63.7" cy="21.3" r="0.6" fill="white" />
      <rect x="22" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      <rect x="32" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      <rect x="44" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      <rect x="54" y="38" width="5" height="10" rx="2" fill="#D4960A" />
      <path d="M18 28 Q8 20 10 30 Q12 38 18 35" stroke="#EFB000" strokeWidth="3" fill="none" strokeLinecap="round" />
      <rect x="28" y="16" width="18" height="14" rx="2" fill={LOGO_NAVY} />
      <rect x="31" y="19" width="12" height="8" rx="1" fill="#0A2A5C" />
      <line x1="37" y1="19" x2="37" y2="27" stroke="rgba(239,176,0,0.5)" strokeWidth="1" />
      <line x1="31" y1="23" x2="43" y2="23" stroke="rgba(239,176,0,0.5)" strokeWidth="1" />
    </svg>
  );
}

function PlaneSVG() {
  return (
    <svg viewBox="0 0 60 30" width="46" height="23" aria-hidden="true">
      <path
        d="M2 18 L22 15 L34 4 L39 4 L31 15 L48 13 L54 16 L48 19 L31 18 L36 27 L31 27 L23 19 L2 20 Z"
        fill="#EFB000"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  3D-style rotating globe accent (pure CSS, no extra deps)            */
/* ------------------------------------------------------------------ */

function SpinningOrb({ mode }: { mode: Mode }) {
  return (
    <div className="orb-wrap" aria-hidden="true">
      <div className="orb-sphere">
        <div className="orb-continents" />
        <div className="orb-shine" />
      </div>
      <div className="orb-ring" />
      <div className="orb-badge">
        <Icon name={mode === 'global' ? 'GlobeAltIcon' : 'MapIcon'} size={13} className="text-[#EFB000]" />
        <span>{mode === 'global' ? 'Global network' : 'Domestic network'}</span>
      </div>
      <style jsx>{`
        .orb-wrap {
          position: relative;
          width: 156px;
          height: 156px;
          filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.45));
        }
        .orb-sphere {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(circle at 32% 30%, #2b5aa0 0%, #123568 45%, #041938 78%, #010a1a 100%);
          overflow: hidden;
          box-shadow: inset -14px -14px 30px rgba(0, 0, 0, 0.55), inset 8px 8px 24px rgba(255, 255, 255, 0.08);
        }
        .orb-continents {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 20% 30%, rgba(239, 176, 0, 0.35) 0 10px, transparent 11px),
            radial-gradient(circle at 60% 20%, rgba(239, 176, 0, 0.25) 0 6px, transparent 7px),
            radial-gradient(circle at 75% 55%, rgba(239, 176, 0, 0.3) 0 14px, transparent 15px),
            radial-gradient(circle at 30% 70%, rgba(239, 176, 0, 0.25) 0 9px, transparent 10px),
            radial-gradient(circle at 55% 80%, rgba(239, 176, 0, 0.2) 0 7px, transparent 8px);
          background-size: 220% 220%;
          animation: driftMap 9s linear infinite;
          mix-blend-mode: screen;
        }
        .orb-shine {
          position: absolute;
          top: 10%;
          left: 14%;
          width: 45%;
          height: 30%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.35), transparent 70%);
          filter: blur(2px);
        }
        .orb-ring {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 1px solid rgba(239, 176, 0, 0.35);
          animation: spinRing 12s linear infinite;
        }
        .orb-ring::before {
          content: '';
          position: absolute;
          top: -3px;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #efb000;
          box-shadow: 0 0 8px 2px rgba(239, 176, 0, 0.8);
        }
        .orb-badge {
          position: absolute;
          bottom: -14px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          background: rgba(4, 25, 56, 0.9);
          border: 1px solid rgba(239, 176, 0, 0.3);
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
        }
        @keyframes driftMap {
          from {
            background-position: 0% 0%;
          }
          to {
            background-position: -220% 0%;
          }
        }
        @keyframes spinRing {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                                */
/* ------------------------------------------------------------------ */

const COPY: Record<Mode, {
  eyebrow: string;
  headlineA: string;
  headlineB: string;
  sub: string;
  trust: { label: string; icon: string }[];
}> = {
  global: {
    eyebrow: "Nepal's International Courier",
    headlineA: 'Nepal',
    headlineB: 'World.',
    sub: 'SwiftYak handles pickup, documentation, and support in Nepal, and works with a trusted delivery partner to get your shipment internationally with full tracking.',
    trust: [
      { label: 'International Courier', icon: 'GlobeAltIcon' },
      { label: '24/7 Support', icon: 'PhoneIcon' },
    ],
  },
  nepal: {
    eyebrow: "Nepal's Domestic Courier",
    headlineA: 'Kathmandu',
    headlineB: 'Nepal.',
    sub: 'SwiftYak connects all seven provinces with same-day valley delivery, next-day inter-city routes, and cash-on-delivery.',
    trust: [
      { label: 'Domestic Delivery', icon: 'MapIcon' },
      { label: 'Same-Day Valley', icon: 'ClockIcon' },
      { label: 'Cash on Delivery', icon: 'BanknotesIcon' },
    ],
  },
};

export default function HeroSection() {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('global');
  const [yakPos, setYakPos] = useState(0);
  const yakRef = useRef<number>(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    animRef.current = setInterval(() => {
      yakRef.current = (yakRef.current + 0.15) % 110;
      setYakPos(yakRef.current);
    }, 16);
    return () => {
      if (animRef.current) clearInterval(animRef.current);
    };
  }, []);

  const copy = COPY[mode];
  // Global mode lets the yak cross the full width; Nepal mode keeps it
  // within a tighter domestic band so the motion still reads as local.
  const yakLeft = mode === 'global' ? yakPos : 15 + (yakPos / 110) * 60;

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{
        background: `linear-gradient(135deg, #020E22 0%, ${LOGO_NAVY} 35%, #0A2A5C 65%, #010A1A 100%)`,
      }}
    >
      {/* Ambient particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {mounted &&
          Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white/20"
              style={{
                left: `${(i * 5.3) % 100}%`,
                top: `${(i * 7.1) % 100}%`,
                animationDelay: `${i * 0.3}s`,
                animation: `floatUpDown ${3 + (i % 3)}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${LOGO_NAVY}CC, transparent)` }}
        aria-hidden="true"
      />

      {/* Yak + trailing plane, walking a delivery route */}
      {mounted && (
        <div
          className="absolute bottom-16 pointer-events-none z-10 transition-[left] duration-300"
          style={{ left: `${yakLeft}${mode === 'global' ? 'vw' : '%'}`, transform: 'translateX(-50%)' }}
          aria-hidden="true"
        >
          <div
            className="absolute bottom-0 left-1/2 h-0.5 bg-gradient-to-r from-transparent via-[#EFB000] to-transparent opacity-60"
            style={{ width: '120px', transform: 'translateX(-50%) translateX(-60px)' }}
          />
          <YakSVG />
        </div>
      )}
      {mounted && mode === 'global' && (
        <div
          className="absolute pointer-events-none z-10 opacity-80"
          style={{ top: '22%', left: `${(yakPos * 1.6) % 100}vw`, transform: 'translateX(-50%) rotate(-6deg)' }}
          aria-hidden="true"
        >
          <PlaneSVG />
        </div>
      )}

      {/* Floating package icons */}
      <div className="absolute top-1/4 left-8 opacity-30 float-anim pointer-events-none" aria-hidden="true">
        <div className="w-8 h-8 bg-[#EFB000]/20 rounded-lg border border-[#EFB000]/30 flex items-center justify-center">
          <Icon name="ArchiveBoxIcon" size={16} className="text-[#EFB000]" />
        </div>
      </div>
      {/* Compact map panel, contained so it never competes with the copy */}
      <div className="hidden md:flex md:flex-col gap-3 absolute top-24 right-4 md:right-6 lg:right-12 z-10 w-[260px] md:w-[300px] lg:w-[360px] xl:w-[400px]">
        <div className="relative">
          <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }} className="absolute -top-4 -left-4 z-20">
            <SpinningOrb mode={mode} />
          </div>

          <div key={mode} className="map-fade rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-white/50">
                {mode === 'global' ? 'Global network' : 'Domestic network'}
              </span>
            </div>
            <div className="relative h-[150px] md:h-[170px] lg:h-[200px] xl:h-[220px] opacity-90">
              <RouteMap mode={mode} />
            </div>
          </div>
        </div>
      </div>

      {/* Hero content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 sm:pt-40 pb-24 w-full">
        <div className="max-w-4xl">
          {/* Eyebrow + mode toggle */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EFB000] animate-glow" />
              <span className="text-white/80 text-xs font-semibold tracking-widest uppercase">{copy.eyebrow}</span>
            </div>

            <div className="inline-flex bg-white/5 border border-white/15 rounded-full p-1" role="tablist" aria-label="Delivery scope">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'global'}
                onClick={() => setMode('global')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  mode === 'global' ? 'bg-[#EFB000] text-[#041938]' : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon name="GlobeAltIcon" size={13} />
                Global
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'nepal'}
                onClick={() => setMode('nepal')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                  mode === 'nepal' ? 'bg-[#EFB000] text-[#041938]' : 'text-white/60 hover:text-white'
                }`}
              >
                <Icon name="MapIcon" size={13} />
                Nepal
              </button>
            </div>
          </div>

          {/* Headline */}
          <h1 key={`${mode}-h1`} className="text-hero-xl font-extrabold text-white leading-tight mb-6 tracking-tight copy-fade">
            Delivering <span className="text-[#EFB000]">{copy.headlineA}</span>{' '}
            <br className="hidden sm:block" />
            to the{' '}
            <span className="relative">
              {copy.headlineB}
              <svg className="absolute -bottom-2 left-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,5 Q50,0 100,4 Q150,8 200,3" stroke="#EFB000" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          {/* Subheading */}
          <p key={`${mode}-sub`} className="text-lg sm:text-xl text-white/65 font-medium leading-relaxed max-w-2xl mb-4 copy-fade">
            {copy.sub}
          </p>

          {/* Delivery model clarification */}
          <p className="text-sm text-[#EFB000]/90 font-semibold mb-10 tracking-wide">
            Domestic and international delivery, backed by trusted logistics partners.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <Link
              href="/tracking"
              className="inline-flex items-center justify-center gap-2.5 bg-white font-bold px-8 py-4 rounded-xl hover:bg-white/95 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl text-base"
              style={{ color: LOGO_NAVY }}
            >
              <Icon name="MagnifyingGlassIcon" size={18} />
              Track Shipment
            </Link>
            <Link
              href="/get-quote"
              className="inline-flex items-center justify-center gap-2.5 font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl text-base"
              style={{
                background: 'linear-gradient(135deg, #EFB000 0%, #FFD040 50%, #D4960A 100%)',
                color: LOGO_NAVY,
              }}
            >
              <Icon name="CalculatorIcon" size={18} />
              Get a Quote
            </Link>
          </div>

          {/* Trust indicators, swap with mode */}
          <div key={`${mode}-trust`} className="flex flex-wrap items-center gap-6 sm:gap-10 copy-fade">
            {copy.trust.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <Icon name={item.icon as never} size={16} className="text-[#EFB000]" />
                <span className="text-white/70 text-sm font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
   { /*  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10" aria-hidden="true">
        <span className="text-white/30 text-xs font-medium tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[#EFB000] animate-scroll-line" />
        </div>
      </div>

      <style jsx>{`
        .map-fade {
          animation: fadeInMap 0.6s ease both;
        }
        .copy-fade {
          animation: fadeInUp 0.45s ease both;
        }
        @keyframes fadeInMap {
          from {
            opacity: 0;
          }
          to {
            opacity: 0.6;
          }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style> */}
    </section>
  );
}