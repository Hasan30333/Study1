// DOM 요소
const districtSelect = document.getElementById('district-select');
const cuisineSelect = document.getElementById('cuisine-select');
const recommendBtn = document.getElementById('recommendBtn');
const btnAgain = document.getElementById('btnAgain');
const resultCard = document.getElementById('resultCard');
const emptyMsg = document.getElementById('emptyMsg');
const resultContent = document.getElementById('resultContent');
const resultDistrict = document.getElementById('result-district');
const resultCuisine = document.getElementById('result-cuisine');
const restaurantName = document.getElementById('restaurant-name');
const restaurantAddress = document.getElementById('restaurant-address');

let seenRestaurants = new Set(); // 추천된 결과 저장 (중복 방지)
let allRestaurants = []; // API로 가져온 전체 데이터 캐싱

// 이벤트 리스너 설정
recommendBtn.addEventListener('click', handleRecommendation);
btnAgain.addEventListener('click', handleRecommendation);

// 필터 변경 시 중복 방지 기록 초기화
districtSelect.addEventListener('change', () => seenRestaurants.clear());
cuisineSelect.addEventListener('change', () => seenRestaurants.clear());


/**
 * 추천 버튼 클릭 시 실행되는 메인 핸들러
 */
async function handleRecommendation() {
    const selectedDistrict = districtSelect.value;
    const selectedCuisine = cuisineSelect.value;

    // 유효성 검사
    if (!selectedDistrict || !selectedCuisine) {
        alert('지역과 음식 종류를 모두 선택해주세요!');
        return;
    }

    showLoading();

    try {
        const restaurants = await fetchRestaurants();
        const filteredRestaurants = filterRestaurants(restaurants, selectedDistrict, selectedCuisine);
        
        displayResult(filteredRestaurants, selectedDistrict, selectedCuisine);

    } catch (error) {
        console.error('An error occurred:', error);
        showError('데이터를 불러오는 중 오류가 발생했습니다.');
    }
}


/**
 * 로컬 JSON 파일에서 음식점 데이터를 가져옵니다. (캐싱 적용)
 * @returns {Promise<Array>} 음식점 데이터 배열
 */
async function fetchRestaurants() {
    // 캐시된 데이터가 있으면 바로 반환
    if (allRestaurants.length > 0) {
        return allRestaurants;
    }

    const response = await fetch('./restaurants.json');
    if (!response.ok) {
        throw new Error('restaurants.json 파일을 불러오는 데 실패했습니다.');
    }
    const data = await response.json();

    // 데이터 캐싱
    allRestaurants = data.DATA || [];
    return allRestaurants;
}

/**
 * 조건에 맞는 음식점을 필터링합니다.
 * @param {Array} restaurants - 전체 음식점 배열
 * @param {string} district - 선택된 지역
 * @param {string} cuisine - 선택된 음식 종류
 * @returns {Array} 필터링된 음식점 배열
 */
function filterRestaurants(restaurants, district, cuisine) {
    return restaurants.filter(r => {
        const address = r.a; // 지번주소
        const uptaeName = r.c;   // 업태명

        // r.TRDSTATENM is no longer needed as we pre-filtered for active only
        const hasAddress = address && address.includes(district);
        const isCuisineMatch = uptaeName && (cuisine === '기타' ? !['한식', '중식', '일식', '양식', '분식'].includes(uptaeName) : uptaeName.includes(cuisine));

        return hasAddress && isCuisineMatch;
    });
}


/**
 * 추천 결과를 화면에 표시합니다.
 * @param {Array} filteredList - 필터링된 음식점 리스트
 * @param {string} district - 선택된 지역
 * @param {string} cuisine - 선택된 음식 종류
 */
function displayResult(filteredList, district, cuisine) {
    // 이미 추천된 곳 제외
    let candidates = filteredList.filter(r => !seenRestaurants.has(r.n));

    // 만약 해당 조건의 모든 맛집을 다 봤다면 기록 초기화 후 다시 선택
    if (candidates.length === 0 && filteredList.length > 0) {
        seenRestaurants.clear();
        candidates = filteredList;
    }

    if (candidates.length > 0) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const choice = candidates[randomIndex];
        seenRestaurants.add(choice.n); // 추천 기록에 추가

        // Update text content for the tags
        resultDistrict.textContent = district;
        resultCuisine.textContent = cuisine;

        // Update restaurant details
        restaurantName.textContent = choice.n; // 업소명
        restaurantAddress.textContent = choice.r || choice.a; // 도로명주소 우선, 없으면 지번주소

        // Update UI visibility and classes
        emptyMsg.style.display = 'none';
        resultContent.style.display = 'block';
        btnAgain.style.display = 'block';
        resultCard.classList.add('has-result');
        
        // Re-trigger animation
        resultCard.classList.remove('popped');
        void resultCard.offsetWidth; 
        resultCard.classList.add('popped');

    } else {
        showError(`'${district} > ${cuisine}'에 맞는 음식점을 찾지 못했어요. 다른 조건을 선택해보세요.`);
        seenRestaurants.clear(); // 결과가 없으면 기록 초기화
    }
}


/**
 * 로딩 상태 UI 표시
 */
function showLoading() {
    emptyMsg.style.display = 'block';
    resultContent.style.display = 'none';
    btnAgain.style.display = 'none';
    resultCard.classList.remove('has-result', 'popped');
    emptyMsg.innerHTML = '<strong>맛집을 찾고 있어요...</strong><br>잠시만 기다려주세요!';
}

/**
 * 에러 메시지 UI 표시
 * @param {string} message - 표시할 에러 메시지
 */
function showError(message) {
    emptyMsg.style.display = 'block';
    resultContent.style.display = 'none';
    btnAgain.style.display = 'none';
    resultCard.classList.remove('has-result');
    emptyMsg.innerHTML = `<strong>이런!</strong><br>${message}`;
}
