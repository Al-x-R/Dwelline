import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Ellipse, G, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { POSTER, fonts, tabularNums } from '../../../constants/theme';
import { useT } from '../../../i18n';
import { formatDuration } from '../../../utils/format';
import { TRANSPORT_ICONS } from '../journeyUtils';
import { LEG_ICON_SIZE, PIN_FOOTPRINT, layoutRouteMap, type MapPin, type MapLeg } from '../routeMapLayout';
import type { RouteNode } from '../useRouteNodes';

interface Props {
  nodes: RouteNode[];
  // Space covered by overlays: chips on top, the summary panel overlapping the bottom.
  insetTop?: number;
  insetBottom?: number;
  // Hide the tap-to-open leg card, e.g. while the map is captured for sharing.
  hideDetails?: boolean;
}

const PAD_X = PIN_FOOTPRINT.width / 2 + 4;
const LABEL_WIDTH = PIN_FOOTPRINT.width;

// Stylised route map: pins placed by real country positions over a topographic backdrop,
// legs as glowing curves coloured by transport (return dashed) with a transport icon on each.
// Tapping an icon highlights the leg and opens a card with departure, arrival and travel time.
export function RouteMap({nodes, insetTop = 0, insetBottom = 0, hideDetails}: Props) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const {t} = useT();
  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    if (!size || size.width !== width || size.height !== height) setSize({width, height});
  };

  const layout = useMemo(
    () =>
      size
        ? layoutRouteMap(nodes, {
          ...size,
          padX: PAD_X,
          padTop: insetTop + PIN_FOOTPRINT.above + 4,
          padBottom: insetBottom + PIN_FOOTPRINT.below + 4,
        })
        : null,
    [nodes, size, insetTop, insetBottom]
  );
  const selected = !hideDetails ? layout?.legs.find((l) => l.key === selectedKey) ?? null : null;

  return (
    <View style={styles.map} onLayout={onLayout}>
      {size ? <Backdrop width={size.width} height={size.height}/> : null}
      {size && layout ? (
        <>
          {/* Tapping empty map closes the leg card. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedKey(null)} accessible={false}/>
          <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill} pointerEvents="none">
            {layout.legs.map((leg) => (
              <LegPath key={leg.key} leg={leg} dimmed={!!selected && selected.key !== leg.key}/>
            ))}
          </Svg>
          {layout.pins.map((pin) => <Pin key={pin.key} pin={pin} width={size.width}/>)}
          {layout.legs.map((leg) => (
            <LegIcon
              key={leg.key}
              leg={leg}
              from={nodes[leg.index]}
              to={nodes[leg.index + 1]}
              active={selected?.key === leg.key}
              dimmed={!!selected && selected.key !== leg.key}
              onPress={() => setSelectedKey((k) => (k === leg.key ? null : leg.key))}
            />
          ))}
          {!selected && !hideDetails && layout.legs.length > 0 ? (
            <View style={[styles.hint, {bottom: insetBottom + 10}]} pointerEvents="none">
              <Ionicons name="hand-left-outline" size={12} color={POSTER.textFaint}/>
              <Text style={styles.hintText}>{t('map.hint')}</Text>
            </View>
          ) : null}
          {selected ? (
            <LegCard
              leg={selected}
              from={nodes[selected.index]}
              to={nodes[selected.index + 1]}
              bottom={insetBottom + 10}
              onClose={() => setSelectedKey(null)}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

function legColor(leg: MapLeg) {
  return leg.transport ? POSTER.transport[leg.transport] : leg.isReturn ? POSTER.inbound : POSTER.outbound;
}

function LegPath({leg, dimmed}: { leg: MapLeg; dimmed: boolean }) {
  const color = legColor(leg);
  return (
    <G opacity={dimmed ? 0.25 : 1}>
      {/* Soft glow under the line. */}
      <Path d={leg.path} stroke={color} strokeOpacity={leg.isReturn ? 0.1 : 0.22} strokeWidth={9} fill="none" strokeLinecap="round"/>
      <Path
        d={leg.path}
        stroke={color}
        strokeOpacity={leg.isReturn ? 0.75 : 1}
        strokeWidth={leg.isReturn ? 2 : 3}
        strokeDasharray={leg.isReturn ? '4 6' : undefined}
        fill="none"
        strokeLinecap="round"
      />
    </G>
  );
}

function LegIcon({leg, from, to, active, dimmed, onPress}: {
  leg: MapLeg; from: RouteNode; to: RouteNode; active: boolean; dimmed: boolean; onPress: () => void;
}) {
  const {t} = useT();
  const color = legColor(leg);
  const size = active ? LEG_ICON_SIZE + 6 : LEG_ICON_SIZE;
  const mode = leg.transport ? t(`transport.${leg.transport}`) : t('map.leg');
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={[
        styles.legIcon,
        {
          left: leg.mid.x - size / 2, top: leg.mid.y - size / 2, width: size, height: size, borderRadius: size / 2,
          borderColor: color, opacity: dimmed ? 0.4 : 1,
        },
        leg.isReturn && styles.legIconReturn,
        active && {backgroundColor: color},
      ]}
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      accessibilityLabel={`${mode}: ${from.name} → ${to.name}`}
    >
      <Ionicons
        name={leg.transport ? TRANSPORT_ICONS[leg.transport] : 'ellipsis-horizontal'}
        size={active ? 16 : 14}
        color={active ? POSTER.canvas : color}
      />
    </Pressable>
  );
}

// Flightradar-style leg card: from → to with departure, arrival and travel time.
function LegCard({leg, from, to, bottom, onClose}: {
  leg: MapLeg; from: RouteNode; to: RouteNode; bottom: number; onClose: () => void;
}) {
  const {t} = useT();
  const color = legColor(leg);
  const mode = leg.transport ? t(`transport.${leg.transport}`) : t('map.leg');
  return (
    <View style={[styles.card, {bottom, borderColor: color}]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, {backgroundColor: color}]}>
          <Ionicons name={leg.transport ? TRANSPORT_ICONS[leg.transport] : 'ellipsis-horizontal'} size={14} color={POSTER.canvas}/>
        </View>
        <Text style={styles.cardMode} numberOfLines={1}>
          {mode}
          <Text style={styles.cardDirection}> · {leg.isReturn ? t('form.inbound') : t('form.outbound')}</Text>
        </Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <Ionicons name="close" size={18} color={POSTER.textMuted}/>
        </Pressable>
      </View>

      <View style={styles.cardRoute}>
        <Endpoint node={from} label={t('map.departure')} time={from.departure}/>
        <View style={styles.cardMiddle}>
          <Text style={[styles.cardDuration, {color}]}>{leg.minutes ? formatDuration(leg.minutes, t) : '—'}</Text>
          <View style={styles.cardTrack}>
            <View style={[styles.cardLine, {backgroundColor: color}, leg.isReturn && styles.cardLineReturn]}/>
            <Ionicons name={leg.transport ? TRANSPORT_ICONS[leg.transport] : 'ellipsis-horizontal'} size={13} color={color}/>
            <View style={[styles.cardLine, {backgroundColor: color}, leg.isReturn && styles.cardLineReturn]}/>
          </View>
          <Text style={styles.cardCaption}>{t('map.inTransit')}</Text>
        </View>
        <Endpoint node={to} label={t('map.arrival')} time={to.arrival} alignEnd/>
      </View>
    </View>
  );
}

function Endpoint({node, label, time, alignEnd}: { node: RouteNode; label: string; time?: string; alignEnd?: boolean }) {
  const {t} = useT();
  const align = alignEnd ? styles.alignEnd : undefined;
  return (
    <View style={[styles.endpoint, align]}>
      <View style={[styles.endpointPlace, alignEnd && styles.rowReverse]}>
        <Text style={styles.endpointFlag}>{node.flag}</Text>
        <Text style={styles.endpointCode}>{node.code ?? '··'}</Text>
      </View>
      <Text style={[styles.endpointName, align && styles.textEnd]} numberOfLines={1}>{node.name}</Text>
      <Text style={[styles.endpointLabel, align && styles.textEnd]}>{label}</Text>
      <Text style={[styles.endpointTime, !time && styles.endpointEmpty, align && styles.textEnd]} numberOfLines={1}>
        {time ?? t('map.noTime')}
      </Text>
    </View>
  );
}

function Pin({pin, width}: { pin: MapPin; width: number }) {
  const {t} = useT();
  const isMain = pin.role === 'main';
  const isStart = pin.role === 'start' || pin.role === 'startFinish';
  const size = isMain ? 40 : 30;
  const halo = size + 16;
  const accent = isMain ? POSTER.main : isStart ? POSTER.start : POSTER.labelBorder;
  // Label below the pin; the bottom padding keeps room for it.
  const labelLeft = Math.min(width - LABEL_WIDTH - 4, Math.max(4, pin.x - LABEL_WIDTH / 2));

  const caption =
    pin.role === 'start' ? [t('map.role.start'), pin.day].filter(Boolean).join(' · ')
      : pin.role === 'finish' ? [t('map.role.finish'), pin.day].filter(Boolean).join(' · ')
        : t(`map.role.${pin.role}`);

  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.pinWrap, {left: pin.x - halo / 2, top: pin.y - halo / 2, width: halo, height: halo}]}
      >
        {isMain || isStart ? (
          <View style={[styles.halo, {width: halo, height: halo, borderRadius: halo / 2, backgroundColor: isMain ? POSTER.mainSoft : POSTER.startSoft}]}/>
        ) : null}
        <View style={[styles.pin, {width: size, height: size, borderRadius: size / 2, borderColor: accent}]}>
          <Text style={{fontSize: size * 0.5}}>{pin.flag}</Text>
        </View>
      </View>
      <View
        pointerEvents="none"
        style={[styles.labelWrap, {left: labelLeft, top: pin.y + halo / 2 - 4}]}
      >
        <View style={[styles.label, {borderColor: accent}, isMain && styles.labelMain]}>
          <View style={styles.captionRow}>
            {isMain ? <View style={styles.mainDot}/> : null}
            <Text style={[styles.caption, {color: isMain ? POSTER.main : isStart ? POSTER.start : POSTER.textMuted}]} numberOfLines={1}>
              {caption}
            </Text>
          </View>
          <Text style={[styles.title, isMain && styles.titleMain]} numberOfLines={1}>{pin.name}</Text>
        </View>
      </View>
    </>
  );
}

// Decorative topographic contours and coastline hints; fixed shapes scaled to the map size.
function Backdrop({width, height}: { width: number; height: number }) {
  const sx = width / 420;
  const sy = height / 520;
  const s = (d: string) => d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_m, x, y) => `${Number(x) * sx} ${Number(y) * sy}`);
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Defs>
        <RadialGradient id="mapGlow" cx="50%" cy="40%" r="65%">
          <Stop offset="0%" stopColor={POSTER.mapGlow} stopOpacity={0.8}/>
          <Stop offset="70%" stopColor={POSTER.canvas} stopOpacity={0.95}/>
          <Stop offset="100%" stopColor={POSTER.canvas} stopOpacity={1}/>
        </RadialGradient>
      </Defs>
      <Rect width={width} height={height} fill="url(#mapGlow)"/>
      <G fill="none" stroke={POSTER.topo} strokeWidth={0.85} opacity={0.45}>
        {[[280, 170], [240, 145], [200, 120], [160, 98], [125, 76], [90, 54]].map(([rx, ry], i) => (
          <Ellipse
            key={rx}
            cx={(210 - i * 4) * sx}
            cy={(180 + i * 11) * sy}
            rx={rx * sx}
            ry={ry * sy}
            stroke={i === 4 ? POSTER.topoStrong : POSTER.topo}
          />
        ))}
        <Path d={s('M -50 320 C 60 290, 130 360, 210 320 C 290 280, 360 360, 480 330')}/>
        <Path d={s('M -50 350 C 70 320, 140 390, 220 350 C 300 310, 370 390, 480 360')} stroke={POSTER.topoStrong}/>
        <Path d={s('M -50 380 C 80 350, 150 420, 230 380 C 310 340, 380 420, 480 390')}/>
        <Path d={s('M -20 120 C 80 80, 180 140, 290 90 C 350 65, 410 110, 460 80')}/>
        <Path d={s('M -10 150 C 90 110, 190 170, 300 120 C 360 95, 420 140, 470 110')}/>
      </G>
      <G fill="none" stroke={POSTER.coast} strokeWidth={0.6} strokeDasharray="2 3">
        <Path d={s('M 40 70 Q 110 130 190 120 T 380 80')} strokeOpacity={0.3}/>
        <Path d={s('M 90 260 Q 180 310 240 290 T 360 330')} strokeOpacity={0.25}/>
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  map: {flex: 1, overflow: 'hidden', backgroundColor: POSTER.canvas},
  legIcon: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    backgroundColor: POSTER.label,
  },
  legIconReturn: {borderStyle: 'dashed'},
  hint: {position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6},
  hintText: {fontFamily: fonts.medium, fontSize: 11, color: POSTER.textFaint},
  card: {
    position: 'absolute', left: 12, right: 12, padding: 12, gap: 10, borderRadius: 16, borderWidth: 1,
    backgroundColor: POSTER.card,
  },
  cardHeader: {flexDirection: 'row', alignItems: 'center', gap: 8},
  cardIcon: {width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  cardMode: {flex: 1, fontFamily: fonts.bold, fontSize: 14, color: POSTER.text},
  cardDirection: {fontFamily: fonts.medium, color: POSTER.textMuted},
  cardRoute: {flexDirection: 'row', alignItems: 'flex-start', gap: 8},
  cardMiddle: {flex: 1, alignItems: 'center', paddingTop: 6, gap: 2},
  cardDuration: {fontFamily: fonts.bold, fontSize: 15, ...tabularNums},
  cardTrack: {flexDirection: 'row', alignItems: 'center', alignSelf: 'stretch', gap: 4},
  cardLine: {flex: 1, height: 2, borderRadius: 1},
  cardLineReturn: {opacity: 0.6},
  cardCaption: {fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: POSTER.textFaint},
  endpoint: {width: '34%', gap: 1},
  alignEnd: {alignItems: 'flex-end'},
  rowReverse: {flexDirection: 'row-reverse'},
  textEnd: {textAlign: 'right'},
  endpointPlace: {flexDirection: 'row', alignItems: 'center', gap: 6},
  endpointFlag: {fontSize: 20},
  endpointCode: {fontFamily: fonts.bold, fontSize: 18, letterSpacing: 0.5, color: POSTER.text},
  endpointName: {fontFamily: fonts.medium, fontSize: 12, color: POSTER.textMuted},
  endpointLabel: {
    fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: POSTER.textFaint,
    marginTop: 6,
  },
  endpointTime: {fontFamily: fonts.semibold, fontSize: 13, color: POSTER.text, ...tabularNums},
  endpointEmpty: {color: POSTER.textFaint, fontFamily: fonts.regular},
  pinWrap: {position: 'absolute', alignItems: 'center', justifyContent: 'center'},
  halo: {position: 'absolute'},
  pin: {alignItems: 'center', justifyContent: 'center', backgroundColor: POSTER.dotHole, borderWidth: 2.5},
  labelWrap: {position: 'absolute', width: LABEL_WIDTH, alignItems: 'center'},
  label: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, backgroundColor: POSTER.label,
    maxWidth: LABEL_WIDTH,
  },
  labelMain: {backgroundColor: POSTER.mainLabel, paddingHorizontal: 10, paddingVertical: 5},
  captionRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  mainDot: {width: 6, height: 6, borderRadius: 3, backgroundColor: POSTER.main},
  caption: {fontFamily: fonts.bold, fontSize: 9, lineHeight: 12, letterSpacing: 0.8, textTransform: 'uppercase'},
  title: {fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, color: POSTER.text},
  titleMain: {fontSize: 13, lineHeight: 17},
});
