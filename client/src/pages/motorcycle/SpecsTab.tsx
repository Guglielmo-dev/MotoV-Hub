import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";

interface SpecsTabProps {
  bike: any;
}

export function SpecsTab({ bike }: SpecsTabProps) {
  const { t, i18n } = useTranslation();
  return (
    <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 sm:p-10 space-y-8">
      <h3 className="text-2xl font-bold font-display border-b border-white/5 pb-4">{t('motorcycleDetails.details')}</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
        <div><dt className="text-sm text-muted-foreground mb-1">{t('garage.brand')}</dt><dd className="font-medium text-lg">{bike.brand}</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">{t('garage.model')}</dt><dd className="font-medium text-lg">{bike.model}</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">{t('garage.year')}</dt><dd className="font-medium text-lg">{bike.year}</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">{t('garage.engineSize')}</dt><dd className="font-medium text-lg">{bike.engineSize}cc</dd></div>
        <div><dt className="text-sm text-muted-foreground mb-1">{t('garage.mileage')}</dt><dd className="font-medium text-lg">{bike.mileage?.toLocaleString()} {t('units.km')}</dd></div>
        {bike.initialMileage !== null && <div><dt className="text-sm text-muted-foreground mb-1">{t('motorcycleDetails.initialMileage')}</dt><dd className="font-medium text-lg">{bike.initialMileage?.toLocaleString()} {t('units.km')}</dd></div>}
        <div><dt className="text-sm text-muted-foreground mb-1">{t('motorcycleDetails.addedToGarage')}</dt><dd className="font-medium text-lg">{bike.createdAt ? format(new Date(bike.createdAt), 'MMMM yyyy', { locale: i18n.language === 'it' ? it : enUS }) : t('motorcycleDetails.unknown')}</dd></div>
      </dl>

      {bike.nftContractAddress && (
        <div className="mt-8 p-6 bg-secondary/50 rounded-xl border border-primary/20">
          <h4 className="flex items-center gap-2 font-bold text-primary mb-2"><ShieldAlert className="w-5 h-5"/> {t('motorcycleDetails.nftVerified')}</h4>
          <p className="text-sm text-muted-foreground font-mono break-all">{t('motorcycleDetails.contractAddress')}: {bike.nftContractAddress}</p>
        </div>
      )}
    </div>
  );
}
