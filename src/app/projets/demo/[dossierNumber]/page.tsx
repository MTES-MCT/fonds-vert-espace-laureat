import {
  CatalogueDossierPage,
  type CataloguePageProps,
} from "@/app/projets/demo/CatalogueDossierPage";

export default function Page(props: CataloguePageProps) {
  return <CatalogueDossierPage {...props} section="summary" />;
}
