# 7. Performance Architecture

## 7.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| App Load Time | < 2 seconds | First meaningful paint |
| Camera Init | < 1 second | Camera ready to capture |
| Local OCR | < 5 seconds | Text extraction complete |
| Cloud Enhancement | < 15 seconds | Full enrichment |
| Contact Search | < 500ms | Results displayed |
| Offline Capability | 100% | Core features work offline |

## 7.2 Optimization Strategies

### Frontend Performance
```typescript
// Service Worker for offline functionality
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/v1/contacts')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// Image optimization
const optimizeImage = async (file: File): Promise<File> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Resize and compress
  canvas.width = Math.min(file.width, 1920);
  canvas.height = Math.min(file.height, 1080);
  
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/webp', 0.8);
  });
};

// Progressive loading
const ContactList = () => {
  const { data, fetchNextPage } = useInfiniteQuery(
    'contacts',
    ({ pageParam = 0 }) => fetchContacts(pageParam),
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );
  
  return (
    <InfiniteScroll onLoadMore={fetchNextPage}>
      {data?.pages.map(page => 
        page.contacts.map(contact => 
          <ContactCard key={contact.id} contact={contact} />
        )
      )}
    </InfiniteScroll>
  );
};
```

### Backend Performance
```typescript
// Redis caching strategy
class ContactService {
  async getContact(id: string): Promise<Contact> {
    // Try cache first
    const cached = await redis.get(`contact:${id}`);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch from database
    const contact = await db.contacts.findById(id);
    
    // Cache for 1 hour
    await redis.setex(`contact:${id}`, 3600, JSON.stringify(contact));
    
    return contact;
  }
  
  async searchContacts(query: string, limit = 20): Promise<Contact[]> {
    return db.contacts.findMany({
      where: {
        searchVector: {
          search: query
        }
      },
      limit,
      orderBy: { rank: 'desc' }
    });
  }
}

// Background job processing
import Bull from 'bull';

const enrichmentQueue = new Bull('enrichment', process.env.REDIS_URL);

enrichmentQueue.process('enrich-contact', async (job) => {
  const { contactId } = job.data;
  
  try {
    const contact = await contactService.getContact(contactId);
    const enrichedData = await enrichmentService.enrichContact(contact);
    await contactService.updateContact(contactId, enrichedData);
    
    // Notify frontend via WebSocket
    io.to(contact.userId).emit('contact-enriched', {
      contactId,
      data: enrichedData
    });
  } catch (error) {
    console.error('Enrichment failed:', error);
    throw error;
  }
});
```
