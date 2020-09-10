#!/bin/bash
cd $( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
source ../../sdk-shared/tutorial/report.sh
source ../../sdk-shared/tutorial/parse.sh
parse "$@"
set -e
rm -r ./package
mkdir package
cd ..
yarn pack
package=$(find applitools*.tgz)
mv "$package" ./tutorial/package/"$package"
cd ./tutorial
docker-compose build $build
docker-compose run wdio4_selenium_basic
docker-compose run wdio4_selenium_ultrafastgrid

sandbox=${sandbox:-true}
report_id=${report_id:-$(uuidgen)]}
report js_wdio_4 "$report_id" "$sandbox"
