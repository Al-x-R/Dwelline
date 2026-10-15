import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { countryCodeToFlag, countryName } from '../../constants/countries';
import { EU_EEA_CODES, TEMPORARY_PROTECTION_CODES, TEMPORARY_PROTECTION_UNTIL } from '../../constants/passportRules';
import { space } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFormatters } from '../../hooks/useFormatters';
import { useT } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import type { ResidenceDoc, ResidenceKind } from '../../types/documents';
import { DatePickerSheet } from '../calendar/DatePickerSheet';
import { BottomSheet, Button, ListRow } from '../ui';
import { CountryPickerSheet } from './CountryPickerSheet';

const KINDS: ResidenceKind[] = ['residence_permit', 'temporary_protection', 'national_visa_d'];

const ALLOWED_COUNTRIES: Record<ResidenceKind, string[] | undefined> = {
  residence_permit: undefined,
  temporary_protection: TEMPORARY_PROTECTION_CODES,
  national_visa_d: EU_EEA_CODES,
};

// Passports and residence statuses that decide which rules apply. Rows only; the caller wraps them in a Card.
export function DocumentsEditor() {
  const {t, lang} = useT();
  const fmt = useFormatters();
  const passports = useSettingsStore((s) => s.passports);
  const setPassports = useSettingsStore((s) => s.setPassports);
  const residences = useSettingsStore((s) => s.residences);
  const setResidences = useSettingsStore((s) => s.setResidences);

  const [passportSlot, setPassportSlot] = useState<number | null>(null);
  // null: closed; -1: new status; otherwise index of the status being edited.
  const [statusIndex, setStatusIndex] = useState<number | null>(null);

  const country = (code: string | undefined) => (code ? `${countryCodeToFlag(code)} ${countryName(code, lang)}` : t('common.notSet'));

  const setPassport = (slot: number, code: string | null) => {
    const next = [...passports];
    if (code) next[slot] = code;
    else next.splice(slot, 1);
    setPassports(next.filter(Boolean));
  };

  const saveStatus = (doc: ResidenceDoc) => {
    setResidences(statusIndex === -1 ? [...residences, doc] : residences.map((r, i) => (i === statusIndex ? doc : r)));
  };

  const removeStatus = () => setResidences(residences.filter((_, i) => i !== statusIndex));

  const statusSubtitle = (doc: ResidenceDoc) => {
    const until = doc.validUntil ?? (doc.kind === 'temporary_protection' ? TEMPORARY_PROTECTION_UNTIL : null);
    const validity = until ? t('docs.validUntilValue', {date: fmt.numeric(until)}) : t('docs.noExpiry');
    return `${t(`docs.kind.${doc.kind}`)} · ${validity}`;
  };

  return (
    <View>
      <ListRow
        icon="card-outline"
        iconTone="primary"
        title={t('docs.passport')}
        subtitle={t('docs.passportHint')}
        value={country(passports[0])}
        onPress={() => setPassportSlot(0)}
      />
      {passports.length > 0 ? (
        <ListRow
          icon="albums-outline"
          title={t('docs.secondPassport')}
          subtitle={t('docs.secondPassportHint')}
          value={country(passports[1])}
          onPress={() => setPassportSlot(1)}
        />
      ) : null}
      {residences.map((doc, i) => (
        <ListRow
          key={`${doc.kind}-${doc.countryCode}-${i}`}
          icon="home-outline"
          iconTone="safe"
          title={country(doc.countryCode)}
          subtitle={statusSubtitle(doc)}
          onPress={() => setStatusIndex(i)}
        />
      ))}
      <ListRow
        icon="add-circle-outline"
        iconTone="primary"
        title={t('docs.addStatus')}
        subtitle={t('docs.addStatusHint')}
        onPress={() => setStatusIndex(-1)}
        last
      />

      <CountryPickerSheet
        visible={passportSlot !== null}
        title={passportSlot === 1 ? t('docs.secondPassport') : t('docs.passport')}
        onSelect={(code) => passportSlot !== null && setPassport(passportSlot, code)}
        onClear={passports[passportSlot ?? 0] ? () => passportSlot !== null && setPassport(passportSlot, null) : undefined}
        onClose={() => setPassportSlot(null)}
      />

      <StatusSheet
        visible={statusIndex !== null}
        initial={statusIndex !== null && statusIndex >= 0 ? residences[statusIndex] : null}
        onSave={saveStatus}
        onRemove={statusIndex !== null && statusIndex >= 0 ? removeStatus : undefined}
        onClose={() => setStatusIndex(null)}
      />
    </View>
  );
}

interface StatusSheetProps {
  visible: boolean;
  initial: ResidenceDoc | null;
  onSave: (doc: ResidenceDoc) => void;
  onRemove?: () => void;
  onClose: () => void;
}

function StatusSheet(props: StatusSheetProps) {
  const {t} = useT();
  return (
    <BottomSheet visible={props.visible} title={props.initial ? t(`docs.kind.${props.initial.kind}`) : t('docs.addStatus')} onClose={props.onClose}>
      {/* Mounted per open, so the draft starts from the current document. */}
      {props.visible ? <StatusSheetBody {...props}/> : null}
    </BottomSheet>
  );
}

function StatusSheetBody({initial, onSave, onRemove, onClose}: StatusSheetProps) {
  const theme = useAppTheme();
  const {t, lang} = useT();
  const fmt = useFormatters();
  const [kind, setKind] = useState<ResidenceKind>(initial?.kind ?? 'residence_permit');
  const [countryCode, setCountryCode] = useState<string | null>(initial?.countryCode ?? null);
  const [validUntil, setValidUntil] = useState<string | null>(initial?.validUntil ?? null);
  const [countryPicker, setCountryPicker] = useState(false);
  const [datePicker, setDatePicker] = useState(false);

  const allowed = ALLOWED_COUNTRIES[kind];
  const effectiveUntil = validUntil ?? (kind === 'temporary_protection' ? TEMPORARY_PROTECTION_UNTIL : null);

  const pickKind = (next: ResidenceKind) => {
    setKind(next);
    const nextAllowed = ALLOWED_COUNTRIES[next];
    if (countryCode && nextAllowed && !nextAllowed.includes(countryCode)) setCountryCode(null);
  };

  const save = () => {
    if (!countryCode) return;
    onSave({countryCode, kind, validUntil});
    onClose();
  };

  return (
    <View>
      {KINDS.map((k) => (
        <ListRow
          key={k}
          title={t(`docs.kind.${k}`)}
          subtitle={t(`docs.kindHint.${k}`)}
          onPress={() => pickKind(k)}
          trailing={
            <Ionicons
              name={k === kind ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={k === kind ? theme.colors.safe : theme.colors.textMuted}
            />
          }
        />
      ))}
      <ListRow
        icon="flag-outline"
        title={t('docs.statusCountry')}
        value={countryCode ? `${countryCodeToFlag(countryCode)} ${countryName(countryCode, lang)}` : t('common.notSet')}
        onPress={() => setCountryPicker(true)}
      />
      <ListRow
        icon="calendar-outline"
        title={t('docs.validUntil')}
        value={effectiveUntil ? fmt.numeric(effectiveUntil) : t('docs.noExpiry')}
        onPress={() => setDatePicker(true)}
        last={!validUntil}
      />
      {validUntil ? (
        <ListRow icon="infinite-outline" title={t('docs.setNoExpiry')} onPress={() => setValidUntil(null)} last/>
      ) : null}

      <View style={styles.actions}>
        <Button label={t('common.save')} icon="checkmark" onPress={save} disabled={!countryCode}/>
        {onRemove ? (
          <Button
            label={t('docs.remove')}
            variant="ghost"
            icon="trash-outline"
            onPress={() => {
              onRemove();
              onClose();
            }}
          />
        ) : null}
      </View>

      {/* Nested inside the sheet: iOS can't present a second modal from the root while this one is open. */}
      <CountryPickerSheet
        visible={countryPicker}
        title={t('docs.statusCountry')}
        allowedCodes={allowed}
        onSelect={setCountryCode}
        onClose={() => setCountryPicker(false)}
      />
      <DatePickerSheet
        visible={datePicker}
        title={t('docs.validUntil')}
        value={effectiveUntil}
        onConfirm={(date) => {
          setValidUntil(date);
          setDatePicker(false);
        }}
        onClose={() => setDatePicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {gap: space.sm, marginTop: space.md},
});
